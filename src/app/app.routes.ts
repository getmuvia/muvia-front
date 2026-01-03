import { Routes } from '@angular/router';
import { ShopLayout } from './layout/shop-layout/shop-layout';
import { SellerLayout } from './layout/seller-layout/seller-layout';
import { Home } from './features/shop/home/home';

export const routes: Routes = [
    {
        path: '',
        component: ShopLayout,
        children: [
            {
                path: 'home',
                component: Home,
            },
            {
                path: 'auth',
                loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
            },
            {
                path: '',
                redirectTo: 'home',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: 'seller',
        component: SellerLayout,
        children: []
    },
    {
        path: '**',
        redirectTo: 'home'
    },
    {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
    }
];
