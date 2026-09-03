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
                data: { headerStyle: 'overlay' }
            },
            {
                path: 'register',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            }
        ]
    }
];
