import { inject, Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { User } from '../models/user.model';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  getAuth,
  updatePassword, reauthenticateWithCredential
} from '@angular/fire/auth';
import { lastValueFrom, Subscription } from "rxjs";
import { Router } from '@angular/router';
import { UserFirestoreService } from './firestore/user-firestore-service';
import { EmailAuthProvider } from "@firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "@angular/fire/app";


@Injectable({ providedIn: 'root' })
export class AuthenticationService implements OnDestroy {
  user: User | null = null;

  userData: any; // Save logged in user data

  auth: Auth = inject(Auth);
  authState$ = authState(this.auth);
  authStateSubscription!: Subscription;


  constructor(private http: HttpClient, public router: Router, private userFirestoreService: UserFirestoreService) {

    this.authStateSubscription = this.authState$.subscribe(user => {
      if (user === null) {
        localStorage.setItem('user', 'null');
        this.router.navigate(['/auth/login']);
      } else {
        this.userFirestoreService.getUserByIdAndEmail(user.uid, user.email ?? '').then(resFS => {
          const user: User = resFS as User;
          localStorage.setItem('user', JSON.stringify(user));
        })
      }
    });

  }

  getUserData(): User | null {
    if (!this.user) {
      this.user = JSON.parse(sessionStorage.getItem('user')!);
    }
    return this.user;
  }

  updateUserData(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    return this.auth.currentUser;
  }

  /**
   * Returns the current user
   */
  public currentUser(): User | null {
    if (!this.user) {
      this.user = JSON.parse(sessionStorage.getItem('currentUser')!);
    }
    return this.user;
  }

  /**
   * Performs the login auth
   * @param email email of user
   * @param password password of user
   */
  login(email: string, password: string): any {

    return new Promise(async (resolve, reject) => {
      try {
        const res = await signInWithEmailAndPassword(this.auth, email, password);
        if (res) {
          const idTokenResult = await res.user.getIdTokenResult(true);
          const claims: any = idTokenResult.claims;
          if (Number(claims.role) < 0 || Number(claims.role) > 4) {
            const error = {
              code: "bad role"
            };
            reject(error);
          }
          this.userFirestoreService.getUserByIdAndEmail(res.user.uid, res.user.email ?? '').then(resFS => {
            const user: User = resFS as User;
            if (user.enabled) {
              localStorage.setItem('user', JSON.stringify(user));
              resolve(user);
            }
            else {
              const error = {
                code: "user not active"
              };
              reject(error);
            }
          })
        }
        else {
          const error = {
            code: "auth/user-not-found"
          };
          reject(error);
        }
        //resolve(res);
      } catch (error) {
        reject(JSON.stringify(error));
      }
    });
  }

  async updatePassword(oldPassword: string, newPassword: string) {
    return new Promise(async (resolve, reject) => {
      const user = this.auth!.currentUser;
      if (user !== null) {
        try {
          const email = user.email ?? "";
          const old_credential = EmailAuthProvider.credential(email, oldPassword);
          const res = await reauthenticateWithCredential(
            user,
            old_credential
          );
          await updatePassword(user, newPassword);
          const new_credential = EmailAuthProvider.credential(email, newPassword);
          const result = await reauthenticateWithCredential(
            user,
            new_credential
          );
          resolve(user);
        } catch (error) {
          reject(error);
        }
      }
    });
  }

  createNewUser(user: User) {
    return new Promise(async (resolve, reject) => {
      const password = this.generatePassword();
      /*const app2 = initializeApp(environment.firebase);
      const auth2 = getAuth(app2);*/
      try {
        const functions = getFunctions(getApp(), "europe-west3");
        const createNewUser = httpsCallable(functions, "createNewUser");
        const userResult = await createNewUser({ email: user.email, password: password }) as any;
        if (userResult.data && userResult.data.uid) {
          //const userResult = await createUserWithEmailAndPassword(auth2, user.email, password);
          user.id = userResult.data.uid;
          await lastValueFrom(this.userFirestoreService.create(user));
          const addClaims = httpsCallable(functions, "addClaims");
          await addClaims({ uid: user.id, role: user.roles });
          const sendPasswordToUser = httpsCallable(functions, "sendPasswordToUser");
          const resultSendPasswordToUser = await sendPasswordToUser({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            password: password
          });
          resolve(resultSendPasswordToUser);
        }
        reject(userResult.data.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  public generatePassword() {
    return Array(8).fill("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$").map(function (x) {
      return x[Math.floor(Math.random() * x.length)]
    }).join('');
  }

  get isLoggedIn() {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null; //&& user.emailVerified !== false;
  }

  // Sign out
  signOut() {
    return this.auth.signOut().then(() => {
      localStorage.removeItem('user');
      localStorage.clear();
      this.router.navigate(['/login']);
    });
  }

  /**
   * Performs the signup auth
   * @param name name of user
   * @param email email of user
   * @param password password of user
   */
  signup(name: string, email: string, password: string): any {
    return this.http.post<any>(`/api/signup`, { name, email, password })
      .pipe(map(user => user));

  }

  /**
   * Logout the user
   */
  logout() {
    return this.auth.signOut().then(() => {
      localStorage.removeItem('user');
      localStorage.clear();
      this.router.navigate(['/auth/login']);
    });
  }

  ngOnDestroy(): void {
    this.authStateSubscription.unsubscribe();
  }
}