import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { FleetService } from './fleet.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @ApiOperation({ summary: 'Lista veículos da frota (paginado)' })
  @ApiQuery({ name: 'status', enum: VehicleStatus, required: false })
  findAll(@Query('status') status?: VehicleStatus, @Query() pagination?: PaginationDto) {
    return this.fleetService.findAll(status, pagination);
  }

  @Get('available')
  @ApiOperation({ summary: 'Lista veículos disponíveis para aluguel' })
  findAvailable() { return this.fleetService.findAvailable(); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do veículo' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.fleetService.findOne(id); }

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cadastra veículo' })
  create(@Body() dto: CreateVehicleDto) { return this.fleetService.create(dto); }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza veículo' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) { return this.fleetService.update(id, dto); }

  @Delete(':id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove veículo (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { await this.fleetService.remove(id); }

  // ── Maintenance ────────────────────────────────────────────────────────────

  @Get(':id/maintenances')
  @ApiOperation({ summary: 'Lista histórico de manutenções do veículo' })
  getMaintenances(@Param('id', ParseUUIDPipe) id: string) {
    return this.fleetService.getMaintenances(id);
  }

  @Post(':id/maintenances')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Registra manutenção para o veículo' })
  addMaintenance(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateMaintenanceDto) {
    return this.fleetService.addMaintenance(id, dto);
  }

  @Patch(':id/complete-maintenance')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Conclui manutenção — retorna veículo como DISPONIVEL' })
  completeMaintenance(@Param('id', ParseUUIDPipe) id: string) {
    return this.fleetService.completeMaintenance(id);
  }
}


@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @ApiOperation({ summary: 'Lista veículos da frota (paginado)' })
  @ApiQuery({ name: 'status', enum: VehicleStatus, required: false })
  findAll(@Query('status') status?: VehicleStatus, @Query() pagination?: PaginationDto) {
    return this.fleetService.findAll(status, pagination);
  }

  @Get('available')
  @ApiOperation({ summary: 'Lista veículos disponíveis para aluguel' })
  findAvailable() { return this.fleetService.findAvailable(); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do veículo' })
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.fleetService.findOne(id); }

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cadastra veículo' })
  create(@Body() dto: CreateVehicleDto) { return this.fleetService.create(dto); }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza veículo' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) { return this.fleetService.update(id, dto); }

  @Delete(':id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove veículo (soft delete)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) { await this.fleetService.remove(id); }
}
