import { DomainEventsService } from '../../common/events/domain-events.service';
import { CONTRATO_FECHADO } from '../rental/rental.events';
import { ContractClosedListener } from './contract-closed.listener';

describe('ContractClosedListener', () => {
  function setup(balanceSaldo: number) {
    const payments = {
      getBalance: jest.fn().mockResolvedValue({ saldo: balanceSaldo }),
      startCharge: jest.fn().mockResolvedValue({ id: 'pay-1' }),
    };
    const events = new DomainEventsService();
    const listener = new ContractClosedListener(events, payments as never);
    listener.onModuleInit();
    return { payments, events, listener };
  }

  it('auto-charges the outstanding balance on ContratoFechado', async () => {
    const { payments, listener } = setup(150);

    await listener.autoCharge('rc1');

    expect(payments.getBalance).toHaveBeenCalledWith('RENTAL_CONTRACT', 'rc1');
    expect(payments.startCharge).toHaveBeenCalledWith({
      refType: 'RENTAL_CONTRACT',
      refId: 'rc1',
      metodo: 'PIX',
    });
  });

  it('does not charge when the balance is already settled', async () => {
    const { payments, listener } = setup(0);

    await listener.autoCharge('rc1');

    expect(payments.startCharge).not.toHaveBeenCalled();
  });

  it('swallows nothing silently — payment failures are logged, not propagated', async () => {
    const { payments, listener } = setup(150);
    payments.startCharge.mockRejectedValueOnce(new Error('gateway down'));

    await expect(listener.autoCharge('rc1')).resolves.toBeUndefined();
  });

  it('reacts to a published ContratoFechado event', async () => {
    const { payments, events } = setup(150);

    events.publish(CONTRATO_FECHADO, { contractId: 'rc9' });
    await new Promise((r) => setImmediate(r));

    expect(payments.getBalance).toHaveBeenCalledWith('RENTAL_CONTRACT', 'rc9');
  });
});
