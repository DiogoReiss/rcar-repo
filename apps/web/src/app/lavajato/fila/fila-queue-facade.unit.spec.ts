import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import type { WashQueueEntry } from '@shared/models/entities.model';
import { FilaService, type QueueStreamEvent } from './fila.service';
import { FilaQueueFacade } from './fila-queue-facade';

const entry = (id: string, status: WashQueueEntry['status']): WashQueueEntry =>
  ({ id, status, serviceId: 's1', posicao: 1, createdAt: '2026-05-08T00:00:00.000Z' }) as WashQueueEntry;

describe('FilaQueueFacade', () => {
  let stream: Subject<QueueStreamEvent>;

  const fila = {
    fetchServices: vi.fn(() => of({ data: [] })),
    fetchCustomers: vi.fn(() => of({ data: [] })),
    fetchQueue: vi.fn(() => of<WashQueueEntry[]>([])),
    addToQueue: vi.fn(() => of(entry('q9', 'AGUARDANDO'))),
    advance: vi.fn(() => of(entry('q1', 'EM_ATENDIMENTO'))),
    pay: vi.fn(() => of({})),
    connectStream: vi.fn(() => stream.asObservable()),
  };

  let facade: FilaQueueFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    stream = new Subject<QueueStreamEvent>();
    TestBed.configureTestingModule({
      providers: [FilaQueueFacade, { provide: FilaService, useValue: fila }],
    });
    facade = TestBed.inject(FilaQueueFacade);
  });

  describe('state machine', () => {
    it('canAdvance is true for waiting and in-progress only', () => {
      expect(facade.canAdvance('AGUARDANDO')).toBe(true);
      expect(facade.canAdvance('EM_ATENDIMENTO')).toBe(true);
      expect(facade.canAdvance('CONCLUIDO')).toBe(false);
      expect(facade.canAdvance(undefined)).toBe(false);
    });

    it('canPay is true only while in progress', () => {
      expect(facade.canPay('EM_ATENDIMENTO')).toBe(true);
      expect(facade.canPay('AGUARDANDO')).toBe(false);
    });
  });

  describe('advanceTo (drag-and-drop)', () => {
    it('no-ops for same or backwards moves', async () => {
      expect(await facade.advanceTo('q1', 'EM_ATENDIMENTO', 'AGUARDANDO')).toBe(false);
      expect(await facade.advanceTo('q1', 'CONCLUIDO', 'CONCLUIDO')).toBe(false);
      expect(fila.advance).not.toHaveBeenCalled();
    });

    it('advances one step per column crossed', async () => {
      const moved = await facade.advanceTo('q1', 'AGUARDANDO', 'CONCLUIDO');
      expect(moved).toBe(true);
      expect(fila.advance).toHaveBeenCalledTimes(2);
    });
  });

  describe('realtime stream', () => {
    it('updates the queue signal from SSE payloads', () => {
      facade.init();
      stream.next({ queue: [entry('q1', 'AGUARDANDO')], ts: 'now' });

      expect(facade.queue()).toHaveLength(1);
      expect(facade.aguardando()).toHaveLength(1);
      expect(facade.sseError()).toBe(false);
    });

    it('flags an error when the stream fails', () => {
      facade.init();
      stream.error(new Error('boom'));

      expect(facade.sseError()).toBe(true);
    });
  });

  it('reload loads the queue from the gateway', async () => {
    fila.fetchQueue.mockReturnValueOnce(of([entry('q1', 'AGUARDANDO')]));
    await facade.reload();

    expect(facade.queue()).toEqual([entry('q1', 'AGUARDANDO')]);
    expect(facade.loading()).toBe(false);
  });
});
