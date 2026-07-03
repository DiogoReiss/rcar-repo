import { canAccessUnit, isGlobalScope, unitScopeWhere } from './unit-scope';

describe('unit-scope', () => {
  const gestor = { role: 'GESTOR_GERAL', unidadeId: null };
  const operadorA = { role: 'OPERADOR', unidadeId: 'unit-a' };

  it('treats GESTOR_GERAL as global scope', () => {
    expect(isGlobalScope(gestor)).toBe(true);
    expect(unitScopeWhere(gestor)).toEqual({});
  });

  it('scopes non-global users to their own unit', () => {
    expect(isGlobalScope(operadorA)).toBe(false);
    expect(unitScopeWhere(operadorA)).toEqual({ unidadeId: 'unit-a' });
  });

  it('does not restrict a scoped user with no unit assigned', () => {
    expect(unitScopeWhere({ role: 'OPERADOR', unidadeId: null })).toEqual({});
  });

  it('grants global users access to any resource unit', () => {
    expect(canAccessUnit(gestor, 'unit-a')).toBe(true);
    expect(canAccessUnit(gestor, 'unit-b')).toBe(true);
  });

  it('grants scoped users access only within their unit', () => {
    expect(canAccessUnit(operadorA, 'unit-a')).toBe(true);
    expect(canAccessUnit(operadorA, 'unit-b')).toBe(false);
  });

  it('treats unassigned resources as accessible during base phase', () => {
    expect(canAccessUnit(operadorA, null)).toBe(true);
  });
});
