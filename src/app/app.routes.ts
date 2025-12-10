import { Routes } from '@angular/router';
import { ShopLayout } from './layout/shop-layout/shop-layout';
import { SellerLayout } from './layout/seller-layout/seller-layout';

export const routes: Routes = [
    {
        path: '',
        component: ShopLayout,
        children: []
    },
    {
        path: 'seller',
        component: SellerLayout,
        children: []
    },
    {
        path: '**',
        redirectTo: ''
    }
];
