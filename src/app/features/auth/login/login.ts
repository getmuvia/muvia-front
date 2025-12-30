import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './login.html',
})
export class Login {
    loginForm: FormGroup;
    showPassword = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    get isLoading() {
        return this.authService.isLoading;
    }

    get error() {
        return this.authService.error;
    }

    togglePasswordVisibility(): void {
        this.showPassword.update(v => !v);
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        const success = await this.authService.login(this.loginForm.value);
        if (success) {
            this.router.navigate(['/home']);
        }
    }
}
