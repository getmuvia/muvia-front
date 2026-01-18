import { Routes } from '@angular/router';
import { ShopLayout } from './layout/shop-layout/shop-layout';
import { SellerLayout } from './layout/seller-layout/seller-layout';
import { Home } from './features/shop/home/home';
import { ProductList } from './features/shop/product/product-list/product-list';
import { ProductDetail } from './features/shop/product/product-detail/product-detail';
import { SellerProfile } from './features/seller/seller-profile/seller-profile';
import { ProductCreate } from './features/seller/product-create/product-create';
import { authGuard } from '@core/auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        component: ShopLayout,
        children: [
            {
                path: 'home',
                component: Home,
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'products',
                component: ProductList,
            },
            {
                path: 'products/:id',
                component: ProductDetail,
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
        canActivate: [authGuard],
        data: { headerStyle: 'transparent' },
        children: [
            {
                path: 'profile',
                component: SellerProfile,
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'products/create',
                component: ProductCreate,
            },
            {
                path: '',
                redirectTo: 'profile',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'home'
    }
];
