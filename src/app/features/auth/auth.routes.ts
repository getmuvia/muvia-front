import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth';
import { Login } from './login/login';
import { Register } from './register/register';
import { AuthLayout } from './layouts/auth-layout';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        component: AuthLayout,
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                component: Login,
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'register',
                component: Register,
                data: { headerStyle: 'transparent' }
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    }
];
