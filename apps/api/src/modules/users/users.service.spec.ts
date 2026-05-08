import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const prisma = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lists only active users ordered by name', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 'u1', nome: 'Ana' }]);
    const service = new UsersService(prisma as never);

    const result = await service.findAll();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { ativo: true, deletedAt: null },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: 'asc' },
    });
    expect(result).toEqual([{ id: 'u1', nome: 'Ana' }]);
  });

  it('throws when user is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const service = new UsersService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates user with hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u2',
      nome: 'Maria',
      email: 'm@x.com',
    });
    const service = new UsersService(prisma as never);

    const result = await service.create({
      nome: 'Maria',
      email: 'm@x.com',
      senha: '12345678',
      role: 'GESTOR_GERAL',
    });

    const createArg = prisma.user.create.mock.calls[0][0];
    expect(createArg.data.nome).toBe('Maria');
    expect(createArg.data.email).toBe('m@x.com');
    expect(createArg.data.role).toBe('GESTOR_GERAL');
    expect(createArg.data.senhaHash).toEqual(expect.any(String));
    expect(createArg.data.senhaHash).not.toBe('12345678');
    expect(result).toEqual({ id: 'u2', nome: 'Maria', email: 'm@x.com' });
  });

  it('throws conflict when email already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    const service = new UsersService(prisma as never);

    await expect(
      service.create({
        nome: 'Maria',
        email: 'm@x.com',
        senha: '12345678',
        role: 'OPERADOR',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
