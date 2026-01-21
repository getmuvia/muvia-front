import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth';

export const AUTH_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./layouts/auth-layout').then(m => m.AuthLayout),
        canActivate: [guestGuard],
        children: [
            {
                path: 'login',
                loadComponent: () => import('./login/login').then(m => m.Login),
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'register',
                loadComponent: () => import('./register/register').then(m => m.Register),
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
