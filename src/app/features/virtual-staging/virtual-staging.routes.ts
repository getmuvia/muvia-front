import { Routes } from '@angular/router';

export const VIRTUAL_STAGING_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./virtual-staging').then(m => m.VirtualStaging)
    },
    {
        path: 'result',
        loadComponent: () => import('./result/result').then(m => m.Result)
    }
];
