import { Module } from '@nestjs/common';
import { TemplatesModule } from '../templates/templates.module.js';
import { DocumentsController } from './documents.controller.js';
import { DocumentsService } from './documents.service.js';
import { HtmlPdfRendererService } from './html-pdf-renderer.service.js';

@Module({
  imports: [TemplatesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, HtmlPdfRendererService],
})
export class DocumentsModule {}

