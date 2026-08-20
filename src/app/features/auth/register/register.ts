import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
    FormField,
    form,
    minLength,
    required,
    submit,
    email,
    validate,
} from '@angular/forms/signals';
import { AuthService } from '@core/auth/services/auth';
import {
    RegisterData,
    USER_ROLES,
    VendorRegisterFormData,
} from '@core/auth/models/auth.models';

@Component({
    selector: 'app-register',
    imports: [RouterLink, FormField],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './register.html',
})
export class Register {
    private readonly authService = inject(AuthService);
    private readonly router = inject(Router);

    registerModel = signal<VendorRegisterFormData>({
        businessName: '',
        email: '',
        password: '',
        description: '',
    });

    registerForm = form(this.registerModel, (path) => {
        required(path.businessName, { message: 'El nombre del negocio es requerido' });
        minLength(path.businessName, 2, { message: 'El nombre del negocio debe tener al menos 2 caracteres' });

        required(path.email, { message: 'El correo electrónico es requerido' });
        email(path.email, { message: 'Ingresa un correo electrónico válido' });

        required(path.password, { message: 'La contraseña es requerida' });
        minLength(path.password, 8, { message: 'La contraseña debe tener al menos 8 caracteres' });
        validate(path.password, ({ value }) => {
            const password = value();
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;
            if (password && !passwordRegex.test(password)) {
                return {
                    message: 'Incluye mayúscula, minúscula, número y carácter especial (@$!%*?&)',
                    kind: 'error',
                };
            }
            return null;
        });
    });

    showPassword = signal(false);

    get isLoading() {
        return this.authService.isLoading;
    }

    get error() {
        return this.authService.error;
    }

    togglePasswordVisibility(): void {
        this.showPassword.update((v) => !v);
    }

    isFieldInvalid(fieldName: keyof VendorRegisterFormData): boolean {
        const fieldSignal = this.registerForm[fieldName];
        if (!fieldSignal) return false;

        const field = fieldSignal();
        return field && field.touched() && field.errors().length > 0;
    }

    onSubmit(event: Event): void {
        event.preventDefault();

        submit(this.registerForm, async () => {

            const formValue = this.registerForm().value();
            const description = formValue.description.trim();
            const registration: RegisterData = {
                email: formValue.email.trim(),
                password: formValue.password,
                role: USER_ROLES.VENDOR,
                vendorProfile: {
                    businessName: formValue.businessName.trim(),
                    ...(description ? { description } : {}),
                },
            };
            const success = await this.authService.register(registration);

            if (success) {
                this.router.navigateByUrl(this.authService.getPostAuthRoute());
            }
        });
    }
}
