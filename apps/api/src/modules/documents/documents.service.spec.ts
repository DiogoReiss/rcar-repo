import { BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('generates a pdf buffer with sanitized file name', async () => {
    const preview = jest
      .fn()
      .mockResolvedValue({ html: '<h1>Contrato</h1><p>Cliente: Maria</p>' });
    const render = jest
      .fn()
      .mockResolvedValue(Buffer.from('%PDF-1.7\nmock', 'utf-8'));
    const service = new DocumentsService(
      { preview } as never,
      { render } as never,
    );

    const result = await service.generateTemplatePdf(
      'template-id',
      { nome: 'Maria' },
      'Contrato Maria 2026',
    );

    expect(preview).toHaveBeenCalledWith('template-id', { nome: 'Maria' });
    expect(render).toHaveBeenCalledWith(
      '<h1>Contrato</h1><p>Cliente: Maria</p>',
    );
    expect(result.fileName).toBe('contrato-maria-2026.pdf');
    expect(result.size).toBeGreaterThan(0);
    expect(result.buffer.toString('utf-8')).toContain('%PDF-1.7');
  });

  it('throws when rendered html is empty', async () => {
    const preview = jest.fn().mockResolvedValue({ html: '   ' });
    const render = jest.fn();
    const service = new DocumentsService(
      { preview } as never,
      { render } as never,
    );

    await expect(
      service.generateTemplatePdf('template-id', {}),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(render).not.toHaveBeenCalled();
  });
});
