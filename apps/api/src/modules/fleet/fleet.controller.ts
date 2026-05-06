import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VehicleStatus } from '@prisma/client';
import { FleetService } from './fleet.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Fleet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Get()
  @ApiOperation({ summary: 'Lista veículos da frota' })
  @ApiQuery({ name: 'status', enum: VehicleStatus, required: false })
  findAll(@Query('status') status?: VehicleStatus) { return this.fleetService.findAll(status); }

  @Get('available')
  @ApiOperation({ summary: 'Lista veículos disponíveis para aluguel' })
  findAvailable() { return this.fleetService.findAvailable(); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do veículo' })
  findOne(@Param('id') id: string) { return this.fleetService.findOne(id); }

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cadastra veículo' })
  create(@Body() dto: CreateVehicleDto) { return this.fleetService.create(dto); }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza veículo' })
  update(@Param('id') id: string, @Body() dto: UpdateVehicleDto) { return this.fleetService.update(id, dto); }

  @Delete(':id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove veículo (soft delete)' })
  async remove(@Param('id') id: string) { await this.fleetService.remove(id); }
}

