import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { GenerateTemplatePdfDto } from './dto/generate-template-pdf.dto.js';
import { DocumentsService } from './documents.service.js';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('templates/:id/pdf')
  @ApiOperation({ summary: 'Gera PDF real a partir de template HTML + variáveis' })
  @ApiConsumes('application/json')
  @ApiProduces('application/pdf')
  @ApiBody({ type: GenerateTemplatePdfDto })
  @ApiResponse({
    status: 201,
    description: 'PDF gerado com sucesso',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiResponse({ status: 400, description: 'Template inválido ou sem conteúdo renderizável' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  @ApiResponse({ status: 500, description: 'Falha de renderização do PDF no servidor' })
  async generateTemplatePdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: GenerateTemplatePdfDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName, size } = await this.documentsService.generateTemplatePdf(id, dto.variables, dto.fileName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', size);
    res.setHeader('Cache-Control', 'no-store');

    return new StreamableFile(buffer);
  }
}


