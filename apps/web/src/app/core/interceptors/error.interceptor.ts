import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

/**
 * A8: Global HTTP error interceptor.
 * Shows a toast for every non-401 error so components don't have to handle errors individually.
 * Components can still override/suppress by catching errors locally before they bubble up.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let 401 fall through to the refresh-token interceptor
      if (error.status === 401) return throwError(() => error);

      const message =
        error.error?.message ??
        (error.status === 0 ? 'Sem conexão com o servidor.' : `Erro ${error.status}: ${error.statusText}`);

      toast.add({ severity: 'error', summary: 'Erro', detail: message, life: 5000 });

      return throwError(() => error);
    }),
  );
};

