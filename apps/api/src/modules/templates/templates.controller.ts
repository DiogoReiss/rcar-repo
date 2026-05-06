import { Controller, Get, Post, Patch, Body, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista templates' })
  findAll() { return this.templatesService.findAll(); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do template' })
  findOne(@Param('id') id: string) { return this.templatesService.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Cria template' })
  create(@Body() dto: CreateTemplateDto) { return this.templatesService.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza template' })
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templatesService.update(id, dto);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Renderiza template com variáveis (preview)' })
  preview(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: false, whitelist: false })) variables: Record<string, unknown>,
  ) {
    return this.templatesService.preview(id, variables);
  }
}

