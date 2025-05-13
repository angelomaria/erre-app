import { Injectable } from "@angular/core";
import { from } from "rxjs";
import { Firestore, collection, doc, getDocs, setDoc, query, where, docData, deleteDoc, updateDoc, getCountFromServer, or, getDoc } from "@angular/fire/firestore";
import { User } from "../../models/user.model";

@Injectable({
  providedIn: "root",
})
export class UserFirestoreService {
  private dbPath = "/users";

  constructor(private firestore: Firestore) { }

  async getById(uid: string) {
    const ref = collection(this.firestore, this.dbPath);
    const q = query(ref, where("id", "==", uid));
    const docsSnap = await getDocs(q);
    const result: any[] = [];
    docsSnap.docs.forEach((doc) => {
      result.push(doc.data());
    });

    return new Promise(async (resolve, reject) => {
      if (result.length === 1) {
        resolve(result[0]);
      } else {
        reject();
      }
    });
  }

  async getUserByIdAndEmail(uid: string, email: string) {
    const ref = collection(this.firestore, this.dbPath);
    const q = query(ref, where("id", "==", uid), where("email", "==", email));
    const docsSnap = await getDocs(q);
    const result: any[] = [];
    docsSnap.docs.forEach((doc) => {
      result.push(doc.data());
    });

    return new Promise(async (resolve, reject) => {
      if (result.length === 1) {
        resolve(result[0]);
      } else {
        reject();
      }
    });
  }

  async filterEmployees(filters: {
    firstname?: string;
    lastname?: string;
    email?: string;
    roles?: string;
    isAdmin?: boolean;          // Admin (tipo booleano)
    isActive?: boolean;         // Attivo (tipo booleano)
    startDate?: Date;           // Data di inizio (tipo data)
    permissions?: string[];     // Permessi (ruoli è una lista di ruoli)
  }): Promise<User[]> {

    // Se non vengono passati filtri, ritorna un array vuoto
    if (
      !filters.firstname &&
      !filters.lastname &&
      !filters.email &&
      !filters.roles &&
      filters.isAdmin === undefined &&
      filters.isActive === undefined &&
      !filters.startDate &&
      !filters.permissions
    ) {
      return [];
    }

    const usersRef = collection(this.firestore, this.dbPath); // Punto alla collezione degli utenti

    // Array delle condizioni
    const conditions = [];

    if (filters.firstname) {
      conditions.push(where("firstname", "==", filters.firstname));
    }
    if (filters.lastname) {
      conditions.push(where("lastname", "==", filters.lastname));
    }
    if (filters.email) {
      conditions.push(where("email", "==", filters.email));
    }
    if (filters.roles) {
      conditions.push(where("roles", "array-contains", filters.roles));
    }
    if (filters.isAdmin !== undefined) {
      conditions.push(where("isAdmin", "==", filters.isAdmin));
    }
    if (filters.isActive !== undefined) {
      conditions.push(where("isActive", "==", filters.isActive));
    }
    if (filters.startDate) {
      conditions.push(where("startDate", "==", filters.startDate));
    }
    if (filters.permissions && filters.permissions.length > 0) {
      // Se la lista dei permessi è presente, faccio una query su un campo che contenga tutti i permessi
      conditions.push(where("permissions", "array-contains-any", filters.permissions));
    }

    // Costruzione della query finale con tutte le condizioni
    const q = query(usersRef, ...conditions);
    const docsSnap = await getDocs(q);

    const result: User[] = [];
    docsSnap.forEach((doc) => {
      result.push(doc.data() as User);
    });

    return result;
  }

  async getAllEmployee() {
    const ref = collection(this.firestore, this.dbPath);
    const q = query(ref, where("roles", "array-contains-any", ['employee', 'voucher']));
    const docsSnap = await getDocs(q);
    const result: any[] = [];
    docsSnap.docs.forEach((doc) => {
      result.push(doc.data());
    });
    return result;
  }

  async getCountEmployee() {
    const coll = collection(this.firestore, this.dbPath);
    const q = query(coll, where("roles", "array-contains-any", ['employee', 'voucher']));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }

  capitalizeWords(str: string): string {
    return str
      .toLowerCase() // Trasforma la stringa in minuscolo
      .split(" ") // Divide la stringa in un array di parole usando lo spazio come delimitatore
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalizza la prima lettera di ogni parola
      .join(" "); // Unisce le parole di nuovo in una stringa
  }

  getFilteredData(filters: any): Promise<any[]> {
    const ref = collection(this.firestore, this.dbPath);
    let q = query(ref);

    if (filters.firstname) {
      console.log(this.capitalizeWords(filters.firstname))
      q = query(
        q,
        or(
          where("firstname", "==", filters.firstname),
          where("firstname", "==", filters.firstname.toLowerCase()),
          where("firstname", "==", filters.firstname.toUpperCase()),
          where("firstname", "==", this.capitalizeWords(filters.firstname))
        )
      );
    }
    if (filters.lastname) {
      q = query(
        q,
        or(
          where("lastname", "==", filters.lastname),
          where("lastname", "==", filters.lastname.toLowerCase()),
          where("lastname", "==", filters.lastname.toUpperCase()),
          where("lastname", "==", this.capitalizeWords(filters.lastname))
        )
      );
    }
    if (filters.active) {
      q = query(q, where("enabled", "==", filters.active));
    }
    if (filters.admin_enabled === true) {
      q = query(q, where("roles", "array-contains", "admin"));
    }
    if (filters.init_date) {
      q = query(q, where("init_date", "==", filters.init_date));
    }
    if (filters.permessi && filters.permessi.length > 0) {
      q = query(q,
        where("roles", "array-contains-any", filters.permessi));
    }

    // Esegui la query
    return getDocs(q).then((querySnapshot) => {
      const data = querySnapshot.docs.map((doc) => doc.data());
      return data;
    });
  }

  async getAll() {
    const ref = collection(this.firestore, this.dbPath);
    const q = query(ref);
    const docsSnap = await getDocs(q);
    const result: any[] = [];
    docsSnap.docs.forEach((doc) => {
      result.push(doc.data());
    });
    return new Promise(async (resolve, reject) => {
      if (result.length > 0) {
        resolve(result);
      } else {
        reject();
      }
    });
  }

  async associaAziendaAUtente(userId: string, companyId: string): Promise<boolean> {
    const userRef = doc(this.firestore, `${this.dbPath}/${userId}`);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      let companyIds = userData["company_id"] || [];

      if (!companyIds.includes(companyId)) {
        companyIds.push(companyId);
        await updateDoc(userRef, { company_id: companyIds });
        return true; // Associazione riuscita
      }
    }

    return false; // L'azienda era già associata
  }


  getObservableUserById(uid: string) {
    const userDocRef = doc(this.firestore, `${this.dbPath}/${uid}`);
    return docData(userDocRef);
  }

  create(user: User) {
    const userDocRef = doc(this.firestore, `${this.dbPath}/${user.id}`);
    return from(setDoc(userDocRef, user));
  }

  update(user: User) {
    const docRef = doc(this.firestore, `${this.dbPath}/${user.id}`);
    return from(updateDoc(docRef, user as any));
  }

  delete(id: string) {
    const docRef = doc(this.firestore, `${this.dbPath}/${id}`);
    return from(deleteDoc(docRef));
  }
}
