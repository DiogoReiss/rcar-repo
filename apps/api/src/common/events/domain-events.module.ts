import { Global, Module } from '@nestjs/common';
import { DomainEventsService } from './domain-events.service.js';

/**
 * Provides the application-wide {@link DomainEventsService}. Global so any
 * feature module can publish or subscribe to domain events without importing
 * another feature module (avoiding DI cycles).
 */
@Global()
@Module({
  providers: [DomainEventsService],
  exports: [DomainEventsService],
})
export class DomainEventsModule {}
