import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';

import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/interceptors/auth.interceptor';
import { refreshTokenInterceptor } from '@core/auth/interceptors/refresh-token.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    // A8: errorInterceptor first so it wraps all outbound requests
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor, refreshTokenInterceptor])),
    MessageService, // required by errorInterceptor and PrimeNG toast
    providePrimeNG({
      theme: { preset: Aura },
    }),
  ],
};
