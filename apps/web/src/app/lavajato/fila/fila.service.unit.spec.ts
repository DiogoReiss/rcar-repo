import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '@core/services/api.service';
import { SseService } from '@core/services/sse.service';
import { FilaService } from './fila.service';

describe('FilaService', () => {
  const api = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  };
  const sse = {
    connect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        FilaService,
        { provide: ApiService, useValue: api },
        { provide: SseService, useValue: sse },
      ],
    });
  });

  it('loads queue into signal', () => {
    const service = TestBed.inject(FilaService);
    api.get.mockReturnValue(of([{ id: 'q1' }]));

    service.loadQueue().subscribe();

    expect(service.queue()).toEqual([{ id: 'q1' }]);
    expect(service.loading()).toBe(false);
  });

  it('connects to SSE queue stream', () => {
    const service = TestBed.inject(FilaService);
    sse.connect.mockReturnValue(of({ queue: [], ts: '2026-05-08T00:00:00.000Z' }));

    service.connectStream().subscribe();

    expect(sse.connect).toHaveBeenCalledWith('/lavajato/queue/stream');
  });
});

