import { DomainEventsService } from '../../common/events/domain-events.service';
import {
  ATENDIMENTO_CONCLUIDO,
  AtendimentoConcluidoEvent,
} from '../lavajato/lavajato.events';
import { StockDeductionService } from './stock-deduction.service';

describe('StockDeductionService', () => {
  function setup() {
    const repo = {
      deductForAtendimento: jest.fn().mockResolvedValue(undefined),
    };
    const events = new DomainEventsService();
    const service = new StockDeductionService(events, repo as never);
    service.onModuleInit();
    return { repo, events, service };
  }

  const event: AtendimentoConcluidoEvent = {
    refId: 'atd-1',
    items: [
      { productId: 'p1', quantidade: '2' },
      { productId: 'p2', quantidade: '0.5' },
    ],
  };

  it('debits stock for every item on AtendimentoConcluido', async () => {
    const { repo, service } = setup();

    await service.handle(event);

    expect(repo.deductForAtendimento).toHaveBeenCalledWith('atd-1', [
      { productId: 'p1', quantidade: '2' },
      { productId: 'p2', quantidade: '0.5' },
    ]);
  });

  it('logs and does not rethrow when the deduction fails', async () => {
    const { repo, service } = setup();
    repo.deductForAtendimento.mockRejectedValueOnce(new Error('db down'));

    await expect(service.handle(event)).resolves.toBeUndefined();
  });

  it('reacts to a published AtendimentoConcluido event', async () => {
    const { repo, events } = setup();

    events.publish(ATENDIMENTO_CONCLUIDO, event);
    await new Promise((r) => setImmediate(r));

    expect(repo.deductForAtendimento).toHaveBeenCalledWith(
      'atd-1',
      expect.any(Array),
    );
  });
});
