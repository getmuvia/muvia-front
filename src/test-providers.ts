import { PRECONNECT_CHECK_BLOCKLIST } from '@angular/common';
import { provideRouter } from '@angular/router';

export default [
  provideRouter([]),
  {
    provide: PRECONNECT_CHECK_BLOCKLIST,
    useValue: 'https://lh3.googleusercontent.com',
  },
];
