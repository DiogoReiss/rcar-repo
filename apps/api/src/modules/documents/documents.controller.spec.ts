import { StreamableFile } from '@nestjs/common';
import { DocumentsController } from './documents.controller';

describe('DocumentsController', () => {
  it('sets download headers and returns streamable file', async () => {
    const buffer = Buffer.from('%PDF-1.4\nmock', 'utf-8');
    const generateTemplatePdf = jest.fn().mockResolvedValue({
      buffer,
      fileName: 'documento.pdf',
      size: buffer.byteLength,
    });
    const controller = new DocumentsController({ generateTemplatePdf } as never);

    const setHeader = jest.fn();
    const response = { setHeader } as never;

    const file = await controller.generateTemplatePdf(
      '4f2209e2-124e-4f93-a36f-a0560f5f4d83',
      { variables: { cliente: 'Maria' } },
      response,
    );

    expect(generateTemplatePdf).toHaveBeenCalledWith(
      '4f2209e2-124e-4f93-a36f-a0560f5f4d83',
      { cliente: 'Maria' },
      undefined,
    );
    expect(setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    expect(setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="documento.pdf"');
    expect(setHeader).toHaveBeenCalledWith('Content-Length', buffer.byteLength);
    expect(file).toBeInstanceOf(StreamableFile);
  });
});


