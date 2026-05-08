import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import puppeteer from 'puppeteer';

@Injectable()
export class HtmlPdfRendererService {
  constructor(private readonly configService: ConfigService) {}

  async render(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: this.executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: this.renderTimeoutMs,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private get renderTimeoutMs(): number {
    return Number(this.configService.get('PDF_RENDER_TIMEOUT_MS') ?? 15000);
  }

  private get executablePath(): string | undefined {
    return (
      this.configService.get<string>('PUPPETEER_EXECUTABLE_PATH') || undefined
    );
  }
}
