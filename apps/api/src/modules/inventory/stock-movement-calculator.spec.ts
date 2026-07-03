import { Prisma } from '@prisma/client';
import { calculateStockMovement } from './stock-movement-calculator';

const dec = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

describe('calculateStockMovement', () => {
  it('recalculates unit cost by weighted average on ENTRADA (ADR-005)', () => {
    // 10 @ 2.00 + 10 @ 4.00 => 20 @ 3.00
    const result = calculateStockMovement(
      { quantidadeAtual: dec(10), custoUnitario: dec(2) },
      { tipo: 'ENTRADA', quantidade: 10, custoUnitario: 4 },
    );

    expect(result.novaQuantidade.toString()).toBe('20');
    expect(result.novoCustoUnitario?.toString()).toBe('3');
  });

  it('keeps the current cost on ENTRADA without a movement cost', () => {
    const result = calculateStockMovement(
      { quantidadeAtual: dec(5), custoUnitario: dec(7) },
      { tipo: 'ENTRADA', quantidade: 5 },
    );

    expect(result.novaQuantidade.toString()).toBe('10');
    expect(result.novoCustoUnitario?.toString()).toBe('7');
  });

  it('subtracts on SAIDA and leaves cost untouched', () => {
    const result = calculateStockMovement(
      { quantidadeAtual: dec(8), custoUnitario: dec(3) },
      { tipo: 'SAIDA', quantidade: 3 },
    );

    expect(result.novaQuantidade.toString()).toBe('5');
    expect(result.novoCustoUnitario?.toString()).toBe('3');
  });

  it('reports a negative result on SAIDA below zero (policy left to caller)', () => {
    const result = calculateStockMovement(
      { quantidadeAtual: dec(1), custoUnitario: dec(3) },
      { tipo: 'SAIDA', quantidade: 5 },
    );

    expect(result.novaQuantidade.lessThan(0)).toBe(true);
  });

  it('replaces the quantity on AJUSTE', () => {
    const result = calculateStockMovement(
      { quantidadeAtual: dec(8), custoUnitario: dec(3) },
      { tipo: 'AJUSTE', quantidade: 2 },
    );

    expect(result.novaQuantidade.toString()).toBe('2');
  });
});
