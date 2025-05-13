import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { AuthenticationService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ReactiveFormsModule],
    template: `
        <app-floating-configurator />
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen min-w-[100vw] overflow-hidden">
            <div class="flex flex-col items-center justify-center">
                <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                    <div class="w-full bg-surface-0 dark:bg-surface-900 py-20 px-8 sm:px-20" style="border-radius: 53px">
                        <div class="text-center mb-8">
                            <img src="/assets/images/logo/errecorporation-logo.png" alt="ERRE CORPORATION S.R.L." style="max-width: 50px;" class="img-responsive mx-auto" />
                            <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">Benvenuto in ERRE CORPORATION S.R.L.!</div>
                            <span class="text-muted-color font-medium">Effettua il login per accedere alla tua area personale</span>
                        </div>
                        <form name="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
                            <label for="email1" class="block text-surface-900 dark:text-surface-0 text-xl font-medium mb-2">Email</label>
                            <input pInputText id="email1" type="text" placeholder="Email address" class="w-full mb-8" formControlName="email" autocomplete="off"/>

                            <label for="password1" class="block text-surface-900 dark:text-surface-0 font-medium text-xl mb-2">Password</label>
                            <p-password id="password1" autocomplete="off" formControlName="password" placeholder="Password" [toggleMask]="true" styleClass="mb-4" [fluid]="true" [feedback]="false"></p-password>

                            <div class="flex items-center justify-between mt-2 mb-8 gap-8">
                                <span class="font-medium no-underline ml-2 text-right cursor-pointer text-primary">Hai dimenticato la password?</span>
                            </div>
                            <p-button label="Accedi" styleClass="w-full" routerLink="/" (click)="$event.preventDefault();onSubmit();"></p-button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class Login implements OnInit {
    returnUrl: string = '/';
    loginForm!: UntypedFormGroup;
    formSubmitted: boolean = false;
    loading: boolean = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authenticationService: AuthenticationService,
        private fb: UntypedFormBuilder
    ) {

    }

    ngOnInit() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
        this.authenticationService.logout();
        this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    }

    get formValues() { return this.loginForm.controls; }

    onSubmit(): void {
        this.formSubmitted = true;
        if (this.loginForm.valid) {
            this.loading = true;
            this.authenticationService.login(this.formValues['email']?.value, this.formValues['password']?.value).then((data: any) => {
                this.router.navigate([this.returnUrl]);
                this.loading = false;
            }).catch((error: any) => {
                error = JSON.parse(error);
                this.loading = false;
                switch (error.code) {
                    case "auth/invalid-login-credentials":
                    case "auth/user-not-found":
                    case "auth/invalid-credential":
                        Swal.fire(environment.appName, 'Email e/o Password errata!<br/>Verifica i dati inseriti e riprova!', 'warning');
                        break;
                    case "bad role":
                        Swal.fire(environment.appName, 'Ruolo errato!', 'warning');
                        break;
                    case "user not active":
                        Swal.fire(environment.appName, 'La tua utenza risulta non attiva. Contatta l\'amministratore di sistema.', 'warning');
                        break;
                    default:
                        Swal.fire(environment.appName, 'Si è verificato un errore generico!', 'warning');
                        break;
                }
            });
        }
    }
}
