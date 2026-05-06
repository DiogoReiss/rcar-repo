import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';

/**
 * A8: Global HTTP error interceptor.
 * Maps status codes to Portuguese user-facing messages and shows them as PrimeNG toasts.
 * Components only need to handle loading/success states — no inline error display needed.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(MessageService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Let 401 fall through to the refresh-token interceptor
      if (error.status === 401) return throwError(() => error);

      const serverMsg: string | undefined = error.error?.message;

      let detail: string;
      if (error.status === 0) {
        detail = 'Sem conexão com o servidor. Verifique sua internet.';
      } else if (error.status === 400 || error.status === 422) {
        detail = serverMsg ?? 'Dados inválidos. Verifique os campos e tente novamente.';
      } else if (error.status === 403) {
        detail = 'Sem permissão para realizar esta ação.';
      } else if (error.status === 404) {
        detail = 'Recurso não encontrado.';
      } else if (error.status === 409) {
        detail = serverMsg ?? 'Conflito ao processar a requisição.';
      } else if (error.status >= 500) {
        detail = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      } else {
        detail = serverMsg ?? 'Ocorreu um erro inesperado.';
      }

      toast.add({ severity: 'error', summary: 'Erro', detail, life: 6000 });

      return throwError(() => error);
    }),
  );
};
