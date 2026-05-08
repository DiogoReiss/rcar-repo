import { firstValueFrom } from 'rxjs';
import { SseService } from './sse.service';

class EventSourceMock {
  static instance: EventSourceMock;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  close = vi.fn();

  constructor(public readonly url: string) {
    EventSourceMock.instance = this;
  }
}

describe('SseService', () => {
  beforeEach(() => {
    vi.stubGlobal('EventSource', EventSourceMock as unknown as typeof EventSource);
  });

  it('emits parsed messages from EventSource', async () => {
    const service = new SseService();
    const stream$ = service.connect<{ queue: number[] }>('/lavajato/queue/stream');

    const promise = firstValueFrom(stream$);
    EventSourceMock.instance.onmessage?.({ data: '{"queue":[1,2]}' } as MessageEvent<string>);

    await expect(promise).resolves.toEqual({ queue: [1, 2] });
  });

  it('closes EventSource on unsubscribe', () => {
    const service = new SseService();
    const sub = service.connect('/lavajato/queue/stream').subscribe();

    sub.unsubscribe();

    expect(EventSourceMock.instance.close).toHaveBeenCalled();
  });
});

