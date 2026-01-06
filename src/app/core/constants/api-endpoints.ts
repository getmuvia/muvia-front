import { environment } from '@environments/environment';

const BASE = environment.apiUrl;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${BASE}/auth/login`,
        REGISTER: `${BASE}/auth/register`,
    },
    CATEGORIES: {
        BASE: `${BASE}/categories`,
    },
    PRODUCTS: {
        BASE: `${BASE}/products`,
        MY_PRODUCTS: `${BASE}/products/my-products`,
    },
    FILES: {
        UPLOAD: `${BASE}/files/upload`,
    }
} as const;
