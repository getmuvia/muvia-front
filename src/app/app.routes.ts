import { Routes } from '@angular/router';
import { authGuard } from '@core/auth/guards/auth.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./layout/shop-layout/shop-layout').then(m => m.ShopLayout),
        children: [
            {
                path: 'home',
                loadComponent: () => import('./features/shop/home/home').then(m => m.Home),
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'products',
                loadComponent: () => import('./features/shop/product/product-list/product-list').then(m => m.ProductList),
                data: { headerStyle: 'transparent' }
            },
            {
                path: 'products/:id',
                loadComponent: () => import('./features/shop/product/product-detail/product-detail').then(m => m.ProductDetail),
            },
            {
                path: 'auth',
                loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
            },
            {
                path: 'virtual-staging',
                loadChildren: () => import('./features/virtual-staging/virtual-staging.routes').then(m => m.VIRTUAL_STAGING_ROUTES)
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
        loadComponent: () => import('./layout/seller-layout/seller-layout').then(m => m.SellerLayout),
        canActivate: [authGuard],
        children: [
            {
                path: 'profile',
                loadComponent: () => import('./features/seller/seller-profile/seller-profile').then(m => m.SellerProfile),
            },
            {
                path: 'products/create',
                loadComponent: () => import('./features/seller/product-create/product-create').then(m => m.ProductCreate),
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
