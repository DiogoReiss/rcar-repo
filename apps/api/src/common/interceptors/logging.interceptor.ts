import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * A4: Request/response logging interceptor.
 * Logs method, URL, status, and duration for every request.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const status = context.switchToHttp().getResponse<{ statusCode: number }>().statusCode;
          this.logger.log(`${method} ${url} → ${status} (${ms}ms)`);
        },
        error: (err: { status?: number }) => {
          const ms = Date.now() - start;
          this.logger.warn(`${method} ${url} → ${err?.status ?? 500} (${ms}ms)`);
        },
      }),
    );
  }
}

