import type { VendorProfile } from '@core/models/user/vendor-profile';

export const USER_ROLES = {
    ADMIN: 'admin',
    VENDOR: 'vendor',
    CONSUMER: 'consumer',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type RegistrationRole = typeof USER_ROLES.VENDOR | typeof USER_ROLES.CONSUMER;

/**
 * User returned by authentication and user endpoints.
 * Authentication responses contain the identity fields; /users/me also
 * includes timestamps and the vendor profile when applicable.
 */
export interface User {
    id: string;
    email: string;
    role: UserRole;
    createdAt?: string;
    updatedAt?: string;
    vendorProfile?: VendorProfile | null;
}

/**
 * Credentials for login
 */
export interface LoginData {
    email: string;
    password: string;
}

/**
 * Data required for registration
 */
export interface RegisterData {
    email: string;
    password: string;
    role: RegistrationRole;
    vendorProfile?: {
        businessName: string;
        description?: string;
    };
}

/**
 * Fields presented by the vendor registration form.
 */
export interface VendorRegisterFormData {
    businessName: string;
    email: string;
    password: string;
    description: string;
}

/**
 * Authentication response from the API
 */
export interface AuthResponse {
    user: User;
    accessToken: string;
}
