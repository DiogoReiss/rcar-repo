import { firstValueFrom } from 'rxjs';
import { QueueEventsService } from './queue-events.service';

describe('QueueEventsService', () => {
  it('emits queue changed events through observable stream', async () => {
    const service = new QueueEventsService();
    const eventPromise = firstValueFrom(service.queueChanged$());

    const emitted = service.emit_queueChanged();
    const event = await eventPromise;

    expect(emitted).toBe(true);
    expect(event.ts).toEqual(expect.any(String));
  });
});
