import { environment } from "@environments/environment";

const BASE = environment.apiUrl;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: `${BASE}/auth/login`,
        REGISTER: `${BASE}/auth/register`,
        CHECK_STATUS: `${BASE}/auth/check-status`,
    },
    CATEGORIES: {
        BASE: `${BASE}/categories`,
    },
    PRODUCTS: {
        BASE: `${BASE}/products`,
        MY_PRODUCTS: `${BASE}/products/my-products`,
    },
    FILES: {
        UPLOAD: `${BASE}/files/upload-url`,
    },
    STORAGE: {
        GOOGLE_CLOUD_BASE_URL: 'https://storage.googleapis.com/itera-484104.firebasestorage.app',
    },
    USERS: {
        ME: `${BASE}/users/me`,
        VENDOR: `${BASE}/users/vendor`,
    }
} as const;
