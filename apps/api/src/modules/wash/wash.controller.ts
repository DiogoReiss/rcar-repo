import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WashService } from './wash.service.js';
import { CreateWashServiceDto } from './dto/create-wash-service.dto.js';
import { UpdateWashServiceDto } from './dto/update-wash-service.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Wash Services')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('wash/services')
export class WashController {
  constructor(private readonly washService: WashService) {}

  @Get()
  @ApiOperation({ summary: 'Lista serviços do lavajato' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') inc?: string) { return this.washService.findAll(inc === 'true'); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do serviço' })
  findOne(@Param('id') id: string) { return this.washService.findOne(id); }

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cria serviço' })
  create(@Body() dto: CreateWashServiceDto) { return this.washService.create(dto); }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza serviço (inclui ativar/desativar)' })
  update(@Param('id') id: string, @Body() dto: UpdateWashServiceDto) { return this.washService.update(id, dto); }
}

