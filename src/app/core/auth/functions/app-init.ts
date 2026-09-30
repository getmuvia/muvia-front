import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { MarketService } from '@core/services/market/market';

/**
 * Starts public bootstrap requests without blocking rendering.
 * Protected route guards await the shared session verification separately.
 */
export const appInit = () => {
    const auth = inject(AuthService);
    const market = inject(MarketService);
    void market.initialize();
    void auth.verifySession();
};
