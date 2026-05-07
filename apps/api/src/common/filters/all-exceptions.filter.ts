import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Maps Prisma error codes to { status, message } pairs.
 * P1xxx = infrastructure/connection errors → 503
 * P2xxx = data errors → 4xx
 */
const PRISMA_ERROR_MAP: Record<string, { status: number; message: string }> = {
  // ─── Infrastructure ────────────────────────────────────────────────────────
  P1000: { status: 503, message: 'Serviço de banco de dados indisponível. Tente novamente mais tarde.' },
  P1001: { status: 503, message: 'Não foi possível conectar ao banco de dados. Tente novamente mais tarde.' },
  P1002: { status: 503, message: 'Tempo limite de conexão com o banco de dados excedido.' },
  P1008: { status: 503, message: 'Operação de banco de dados excedeu o tempo limite.' },
  P1017: { status: 503, message: 'Conexão com o banco de dados encerrada pelo servidor.' },

  // ─── Data / request ────────────────────────────────────────────────────────
  P2000: { status: 400, message: 'Valor fornecido é muito longo para o campo.' },
  P2001: { status: 404, message: 'Registro não encontrado.' },
  P2002: { status: 409, message: 'Já existe um registro com esse valor único.' },
  P2003: { status: 400, message: 'Violação de chave estrangeira — registro relacionado não existe.' },
  P2004: { status: 400, message: 'Violação de restrição no banco de dados.' },
  P2005: { status: 400, message: 'Valor inválido para o campo.' },
  P2006: { status: 400, message: 'Valor fornecido inválido.' },
  P2007: { status: 400, message: 'Erro de validação de dados.' },
  P2010: { status: 500, message: 'Erro interno ao executar consulta.' },
  P2011: { status: 400, message: 'Valor nulo não permitido para este campo.' },
  P2012: { status: 400, message: 'Campo obrigatório ausente.' },
  P2013: { status: 400, message: 'Argumento obrigatório ausente.' },
  P2014: { status: 400, message: 'Violação de relação entre registros.' },
  P2015: { status: 404, message: 'Registro relacionado não encontrado.' },
  P2016: { status: 400, message: 'Erro de interpretação de consulta.' },
  P2017: { status: 400, message: 'Registros da relação não estão conectados.' },
  P2018: { status: 400, message: 'Registros conectados necessários não foram encontrados.' },
  P2019: { status: 400, message: 'Erro de entrada de dados.' },
  P2020: { status: 400, message: 'Valor fora do intervalo permitido para o campo.' },
  P2021: { status: 500, message: 'Tabela não encontrada no banco de dados.' },
  P2022: { status: 500, message: 'Coluna não encontrada no banco de dados.' },
  P2025: { status: 404, message: 'Registro não encontrado ou operação dependente falhou.' },
  P2034: { status: 409, message: 'Conflito de transação — tente novamente.' },
};

/**
 * Global exception filter that handles:
 *  - HttpException (NestJS / class-validator / manual throws)
 *  - PrismaClientKnownRequestError   (P2xxx data errors)
 *  - PrismaClientInitializationError (P1xxx connection errors)
 *  - PrismaClientUnknownRequestError
 *  - Any other unexpected error → 500
 *
 * Sensitive Prisma internals are never exposed to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);

    // Log at the appropriate level
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${request.method} ${request.url} → ${status}: ${body.message}`);
    }

    response.status(status).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  // ─── Resolution logic ──────────────────────────────────────────────────────

  private resolve(exception: unknown): { status: number; body: Record<string, unknown> } {
    // 1. NestJS HttpException (includes class-validator BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const status   = exception.getStatus();
      const raw      = exception.getResponse();
      const body     = typeof raw === 'string'
        ? { statusCode: status, message: raw, error: raw }
        : { statusCode: status, ...(raw as object) };
      return { status, body };
    }

    // 2. Prisma known request error (P2xxx, P1xxx via driver adapter)
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = PRISMA_ERROR_MAP[exception.code];
      if (mapped) {
        return {
          status: mapped.status,
          body: {
            statusCode: mapped.status,
            error: exception.code,
            message: this.enrichMessage(exception, mapped.message),
          },
        };
      }
      // Unknown Prisma code → safe 500
      return this.internalError(`Prisma ${exception.code}`);
    }

    // 3. Prisma initialization / connection error (P1xxx via main runtime)
    if (exception instanceof Prisma.PrismaClientInitializationError) {
      const mapped = exception.errorCode ? PRISMA_ERROR_MAP[exception.errorCode] : undefined;
      const message = mapped?.message ?? 'Serviço de banco de dados indisponível.';
      const status  = mapped?.status  ?? 503;
      return {
        status,
        body: { statusCode: status, error: exception.errorCode ?? 'DB_INIT', message },
      };
    }

    // 4. Prisma validation error (bad arguments passed to Prisma — dev mistake)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'VALIDATION_ERROR',
          message: 'Erro de validação na operação de banco de dados.',
        },
      };
    }

    // 5. Prisma unknown request error
    if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      return this.internalError('PRISMA_UNKNOWN');
    }

    // 6. Everything else → 500
    return this.internalError('INTERNAL_SERVER_ERROR');
  }

  /** Add field-level context to the message when available (e.g. unique constraint on which field). */
  private enrichMessage(
    err: Prisma.PrismaClientKnownRequestError,
    baseMessage: string,
  ): string {
    if (err.code === 'P2002') {
      const fields = (err.meta?.['target'] as string[] | undefined)?.join(', ');
      return fields ? `${baseMessage} (campo: ${fields})` : baseMessage;
    }
    if (err.code === 'P2025') {
      const cause = err.meta?.['cause'] as string | undefined;
      return cause ? `${baseMessage} (${cause})` : baseMessage;
    }
    return baseMessage;
  }

  private internalError(error: string): { status: number; body: Record<string, unknown> } {
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error,
        message: 'Erro interno do servidor. Tente novamente mais tarde.',
      },
    };
  }
}

