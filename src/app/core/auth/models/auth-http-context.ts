import { HttpContextToken } from '@angular/common/http';

/** Session checks invalidate expired credentials without redirecting public pages. */
export const SILENT_SESSION_CHECK = new HttpContextToken<boolean>(() => false);
