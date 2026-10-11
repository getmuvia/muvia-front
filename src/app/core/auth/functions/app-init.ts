import { inject } from '@angular/core';
import { AuthService } from '../services/auth';
import { MarketService } from '@core/services/market/market';
import { I18nService } from '@core/services/i18n/i18n';

/**
 * Starts public bootstrap requests without blocking rendering.
 * Protected route guards await the shared session verification separately.
 */
export const appInit = () => {
    inject(I18nService);
    const auth = inject(AuthService);
    const market = inject(MarketService);
    void market.initialize();
    void auth.verifySession();
};
