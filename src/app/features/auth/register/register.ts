import { Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/auth';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.html',
})
export class Register {
    registerForm: FormGroup;
    showPassword = signal(false);

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            businessName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            description: ['']
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
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const success = await this.authService.register(this.registerForm.value);
        if (success) {
            // After successful registration, redirect to login
            this.router.navigate(['/auth/login']);
        }
    }
}
