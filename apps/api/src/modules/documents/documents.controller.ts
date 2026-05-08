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
  @ApiOperation({ summary: 'Gera PDF a partir de template + variáveis (scaffold inicial)' })
  @ApiConsumes('application/json')
  @ApiProduces('application/pdf')
  @ApiBody({ type: GenerateTemplatePdfDto })
  @ApiResponse({
    status: 201,
    description: 'PDF gerado com sucesso',
    schema: { type: 'string', format: 'binary' },
  })
  async generateTemplatePdf(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: GenerateTemplatePdfDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, fileName } = await this.documentsService.generateTemplatePdf(id, dto.variables, dto.fileName);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return new StreamableFile(buffer);
  }
}


