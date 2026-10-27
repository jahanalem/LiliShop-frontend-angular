import { HttpContextToken } from '@angular/common/http';

// Opt in only when a view owns all error states, including missing-record navigation.
export const HANDLE_ERROR_LOCALLY = new HttpContextToken<boolean>(() => false);
