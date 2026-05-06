import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';

import { routes } from './app.routes';
import { authInterceptor } from '@core/auth/interceptors/auth.interceptor';
import { refreshTokenInterceptor } from '@core/auth/interceptors/refresh-token.interceptor';
import { errorInterceptor } from '@core/interceptors/error.interceptor';
import { mockApiInterceptor } from '@core/interceptors/mock-api.interceptor';
import { environment } from '@env/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideRouter(routes),
    // A8: errorInterceptor first so it wraps all outbound requests.
    // In mock mode the mockApiInterceptor short-circuits before hitting the network.
    provideHttpClient(
      withInterceptors(
        environment.mock
          ? [mockApiInterceptor]
          : [errorInterceptor, authInterceptor, refreshTokenInterceptor],
      ),
    ),
    MessageService, // required by errorInterceptor and PrimeNG toast
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, {
          semantic: {
            primary: {
              50:  '#fff8ed',
              100: '#fdefd5',
              200: '#fcd9a8',
              300: '#f9bb6a',
              400: '#f5a63e',
              500: '#ec8609',
              600: '#c46e07',
              700: '#8e4f05',
              800: '#6a3b04',
              900: '#4d2a03',
              950: '#2e1901',
            },
          },
        }),
        options: { darkModeSelector: 'none' },
      },
    }),
  ],
};
