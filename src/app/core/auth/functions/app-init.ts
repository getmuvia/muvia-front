import { inject } from '@angular/core';
import { Auth } from '../services/auth';

/**
 * Initializes the application by verifying the user's session.
 * This runs before the app renders to prevent flashing authenticated state.
 */
export const appInit = () => {
    const auth = inject(Auth);
    return auth.verifySession();
};
