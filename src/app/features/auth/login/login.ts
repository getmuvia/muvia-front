import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormField,
  form,
  minLength,
  required,
  submit,
  email,
} from '@angular/forms/signals';
import { AuthService } from '@core/auth/services/auth';
import { LoginData } from '@core/auth/models/auth.models'

@Component({
  selector: 'app-login',
  imports: [FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.html',
})
export class Login {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly demoCredentials: LoginData = {
    email: 'decor@decor.com',
    password: 'Decordemo123@',
  };

  loginModel = signal<LoginData>({
    ...this.demoCredentials,
  });

  loginForm = form(this.loginModel, (path) => {

    required(path.email, { message: 'El correo electrónico es requerido' });

    email(path.email, { message: 'Ingresa un correo electrónico válido' });

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

  onSubmit(event: Event): void {
    event.preventDefault();

    submit(this.loginForm, async () => {
      const credentials = this.loginForm().value();
      const success = await this.authService.login(credentials);

      if (success) {
        this.router.navigateByUrl(this.getSafeReturnUrl());
      }
    });
  }

  private getSafeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/') && !returnUrl.startsWith('//')
      ? returnUrl
      : this.authService.getPostAuthRoute();
  }
}
