import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard.js';
import { ExecutionContext } from '@nestjs/common';

function createMockContext(
  user: { role?: string } | null,
  handlerRoles?: string[],
  classRoles?: string[],
): ExecutionContext {
  return {
    getHandler: () => (handlerRoles ? { __roles: handlerRoles } : {}),
    getClass: () => (classRoles ? { __roles: classRoles } : {}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow when no roles required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ role: 'OPERADOR' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow when user has required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['GESTOR_GERAL']);
    const ctx = createMockContext({ role: 'GESTOR_GERAL' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['GESTOR_GERAL']);
    const ctx = createMockContext({ role: 'OPERADOR' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should deny when no user', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['GESTOR_GERAL']);
    const ctx = createMockContext(null);
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow OPERADOR_LEITURA when included in required roles', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OPERADOR', 'OPERADOR_LEITURA']);
    const ctx = createMockContext({ role: 'OPERADOR_LEITURA' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should deny OPERADOR_LEITURA when only OPERADOR is required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OPERADOR']);
    const ctx = createMockContext({ role: 'OPERADOR_LEITURA' });
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('should allow OPERADOR when both OPERADOR and OPERADOR_LEITURA are required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['OPERADOR', 'OPERADOR_LEITURA']);
    const ctx = createMockContext({ role: 'OPERADOR' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow GESTOR_GERAL when multiple roles including GESTOR_GERAL are required', () => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(['GESTOR_GERAL', 'OPERADOR']);
    const ctx = createMockContext({ role: 'GESTOR_GERAL' });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
