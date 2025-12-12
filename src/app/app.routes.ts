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
                path: '**',
                redirectTo: 'home'
            }
        ]
    },
    {
        path: 'seller',
        component: SellerLayout,
        children: []
        
    }

];
