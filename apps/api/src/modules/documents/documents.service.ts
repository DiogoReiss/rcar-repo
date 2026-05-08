import { Injectable } from '@nestjs/common';
import { TemplatesService } from '../templates/templates.service.js';

@Injectable()
export class DocumentsService {
  constructor(private readonly templatesService: TemplatesService) {}

  async generateTemplatePdf(templateId: string, variables: Record<string, unknown>, fileName?: string) {
    const { html } = await this.templatesService.preview(templateId, variables);
    const text = this.extractTextFromHtml(html);

    // Foundation scaffold: lightweight PDF generation until Puppeteer renderer is added.
    const pdfBuffer = this.createSimplePdfBuffer(text);
    return {
      buffer: pdfBuffer,
      fileName: `${(fileName?.trim() || 'documento').replace(/\s+/g, '-').toLowerCase()}.pdf`,
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
      .trim();
  }

  private createSimplePdfBuffer(text: string): Buffer {
    const escaped = this.escapePdfText(text || 'Documento');
    const stream = `BT\n/F1 11 Tf\n50 780 Td\n(${escaped}) Tj\nET`;

    const objects = [
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
      '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
      `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    ];

    let body = '%PDF-1.4\n';
    const offsets: number[] = [0];

    for (const object of objects) {
      offsets.push(body.length);
      body += object;
    }

    const xrefOffset = body.length;
    body += `xref\n0 ${objects.length + 1}\n`;
    body += '0000000000 65535 f \n';
    for (const offset of offsets.slice(1)) {
      body += `${String(offset).padStart(10, '0')} 00000 n \n`;
    }

    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(body, 'utf-8');
  }

  private escapePdfText(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)');
  }
}

