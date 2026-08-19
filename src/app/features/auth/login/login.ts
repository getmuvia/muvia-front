import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  FormField,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { AuthService } from '@core/auth/services/auth';
import { LoginData } from '@core/auth/models/auth.models'

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormField],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginModel = signal<LoginData>({
    email: 'vendor@test.com',
    password: 'Test123!@#',
  });

  loginForm = form(this.loginModel, (path) => {

    required(path.email, { message: 'El correo electrónico es requerido' });

    validate(path.email, ({ value }) => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (value() && !emailRegex.test(value())) {
        return {
          message: 'Ingresa un correo electrónico válido',
          kind: 'error',
        };
      }
      return null;
    });

    required(path.password, { message: 'La contraseña es requerida' });
    minLength(path.password, 6, { message: 'La contraseña debe tener al menos 6 caracteres' });
  });

  showPassword = signal(false);

  isLoading = this.authService.isLoading;
  error = this.authService.error;

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  isFieldInvalid(fieldName: keyof LoginData): boolean {
    const fieldSignal = this.loginForm[fieldName];
    if (!fieldSignal) return false;

    const field = fieldSignal();
    return field && field.touched() && field.errors().length > 0;
  }

  onSubmit(event: Event) {
    event.preventDefault();

    submit(this.loginForm, async () => {
      const credentials = this.loginForm().value();
      const success = await this.authService.login(credentials);

      if (success) {
        this.router.navigate(['/home']);
      }
    });
  }
}
