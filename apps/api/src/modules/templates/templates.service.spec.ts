import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from './templates.service';

describe('TemplatesService', () => {
  const prisma = {
    template: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders preview using handlebars variables', async () => {
    prisma.template.findUnique.mockResolvedValue({
      id: 't1',
      conteudoHtml: '<p>Olá {{nome}}</p>',
    });
    const service = new TemplatesService(prisma as never);

    const result = await service.preview('t1', { nome: 'Maria' });

    expect(result.html).toContain('Olá Maria');
  });

  it('throws when template is not found', async () => {
    prisma.template.findUnique.mockResolvedValue(null);
    const service = new TemplatesService(prisma as never);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
