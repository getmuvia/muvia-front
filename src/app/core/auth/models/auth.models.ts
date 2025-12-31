/**
 * User model interface
 */
export interface User {
    id: string;
    email: string;
    businessName?: string;
    description?: string;
    createdAt?: Date;
    updatedAt?: Date;
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
    refreshToken?: string;
}
