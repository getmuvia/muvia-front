import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { MarketService } from '@core/services/market/market';

/**
 * Initializes the application by verifying the user's session.
 * This runs before the app renders to prevent flashing authenticated state.
 */
export const appInit = () => {
    const auth = inject(AuthService);
    const market = inject(MarketService);
    void market.initialize();
    return auth.verifySession();
};
