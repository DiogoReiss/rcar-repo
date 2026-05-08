import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import { Observable, fromEvent } from 'rxjs';

export interface QueueChangedEvent {
  ts: string;
}

/**
 * A15: In-process event emitter so the SSE endpoint can push queue snapshots
 * only when the queue actually changes, rather than pinging every 3 seconds.
 */
@Injectable()
export class QueueEventsService extends EventEmitter {
  static readonly QUEUE_CHANGED = 'queue:changed';

  emit_queueChanged(): boolean {
    return this.emit(QueueEventsService.QUEUE_CHANGED, {
      ts: new Date().toISOString(),
    });
  }

  queueChanged$(): Observable<QueueChangedEvent> {
    return fromEvent<QueueChangedEvent>(this, QueueEventsService.QUEUE_CHANGED);
  }
}
