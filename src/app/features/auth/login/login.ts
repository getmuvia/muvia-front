import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  Field,
  form,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { AuthService } from '@core/auth/services/auth.service';
import { LoginData } from '@core/auth/models/auth.models'

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, Field],
  templateUrl: './login.html',
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginModel = signal<LoginData>({
    email: '',
    password: '',
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

  isLoading = signal(false); 

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
      this.isLoading.set(true);
      try {
        const credentials = this.loginForm().value();
        const success = await this.authService.login(credentials);
        
        if (success) {
          this.router.navigate(['/home']);
        }
      } catch (error) {
        console.error('Login error', error);
        // Aquí podrías setear un error general del formulario si la API lo permite
      } finally {
        this.isLoading.set(false);
      }
    });
  }
}
