import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HtmlPdfRendererService } from './html-pdf-renderer.service.js';
import { TemplatesService } from '../templates/templates.service.js';

const MAX_TEXT_LENGTH = 4000;
const PDF_EXTENSION = '.pdf';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly templatesService: TemplatesService,
    private readonly htmlPdfRendererService: HtmlPdfRendererService,
  ) {}

  async generateTemplatePdf(
    templateId: string,
    variables: Record<string, unknown>,
    fileName?: string,
  ) {
    const { html } = await this.templatesService.preview(templateId, variables);
    if (!html?.trim()) {
      throw new BadRequestException(
        'Não foi possível gerar PDF: template vazio.',
      );
    }

    const text = this.extractTextFromHtml(html);
    if (!text) {
      throw new BadRequestException(
        'Não foi possível gerar PDF: conteúdo sem texto renderizável.',
      );
    }

    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await this.htmlPdfRendererService.render(html);
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível renderizar o PDF no servidor.',
      );
    }
    const safeFileName = this.normalizeFileName(fileName);

    return {
      buffer: pdfBuffer,
      fileName: safeFileName,
      size: pdfBuffer.byteLength,
    };
  }

  private extractTextFromHtml(html: string): string {
    return html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, MAX_TEXT_LENGTH);
  }

  private normalizeFileName(fileName?: string): string {
    const baseName = (fileName ?? 'documento')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .slice(0, 80);

    const normalized = baseName || `documento-${Date.now()}`;
    return normalized.endsWith(PDF_EXTENSION)
      ? normalized
      : `${normalized}${PDF_EXTENSION}`;
  }
}
