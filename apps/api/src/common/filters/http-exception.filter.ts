import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = typeof exceptionResponse === 'string'
      ? { statusCode: status, message: exceptionResponse, error: exceptionResponse }
      : { statusCode: status, ...(exceptionResponse as object) };

    response.status(status).json({
      ...errorBody,
      timestamp: new Date().toISOString(),
    });
  }
}

