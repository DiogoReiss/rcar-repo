import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';

/**
 * In-process domain event bus. A neutral, application-global seam so that a
 * module can publish a domain event without depending on the module(s) that
 * react to it. This keeps side effects (e.g. auto-charging a closed contract)
 * in the owning module (Pagamento) instead of leaking into the emitter
 * (Contrato), and prevents circular NestJS module imports.
 */
@Injectable()
export class DomainEventsService extends EventEmitter {
  publish<T>(event: string, payload: T): void {
    this.emit(event, payload);
  }

  subscribe<T>(event: string, handler: (payload: T) => void): void {
    this.on(event, handler);
  }
}
