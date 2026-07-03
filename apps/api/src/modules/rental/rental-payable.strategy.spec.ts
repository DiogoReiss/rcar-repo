import { NotFoundException } from '@nestjs/common';
import { RentalPayableStrategy } from './rental-payable.strategy';

describe('RentalPayableStrategy', () => {
  const makeStrategy = (findUnique: jest.Mock) => {
    const registry = { register: jest.fn() };
    const strategy = new RentalPayableStrategy(
      { rentalContract: { findUnique } } as never,
      registry as never,
    );
    return { strategy, registry };
  };

  it('registers itself into the registry on module init', () => {
    const { strategy, registry } = makeStrategy(jest.fn());

    strategy.onModuleInit();

    expect(registry.register).toHaveBeenCalledWith(strategy);
    expect(strategy.refType).toBe('RENTAL_CONTRACT');
  });

  it('resolves a payable using valorTotalReal when present', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'c1',
      customerId: 'cust1',
      valorTotal: 300,
      valorTotalReal: 250,
      customer: { id: 'cust1', nome: 'Cliente' },
    });
    const { strategy } = makeStrategy(findUnique);

    const payable = await strategy.resolve('c1');

    expect(payable).toEqual({
      valor: 250,
      customerId: 'cust1',
      customerName: 'Cliente',
      contractId: 'c1',
    });
  });

  it('falls back to valorTotal when valorTotalReal is null', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'c1',
      customerId: 'cust1',
      valorTotal: 300,
      valorTotalReal: null,
      customer: { id: 'cust1', nome: 'Cliente' },
    });
    const { strategy } = makeStrategy(findUnique);

    const payable = await strategy.resolve('c1');

    expect(payable.valor).toBe(300);
  });

  it('throws NotFound when the contract does not exist', async () => {
    const { strategy } = makeStrategy(jest.fn().mockResolvedValue(null));

    await expect(strategy.resolve('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
