import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { MasterAgreementsService } from './master-agreements.service.js';
import {
  CreateMasterAgreementDto,
  LinkVehicleDto,
} from './dto/master-agreement.dto.js';

/** Acordos em lote (contrato-mestre) — manager-only (GESTOR_GERAL). */
@ApiTags('Master Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL')
@Controller('master-agreements')
export class MasterAgreementsController {
  constructor(private readonly service: MasterAgreementsService) {}

  @Post()
  @ApiOperation({ summary: 'Cria acordo em lote (contrato-mestre)' })
  create(
    @Body() dto: CreateMasterAgreementDto,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Lista acordos em lote' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do acordo com itens/veículos' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/apuracao')
  @ApiOperation({ summary: 'Apuração por veículo e por ciclo' })
  apuracao(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.apuracao(id);
  }

  @Post(':id/vehicles')
  @ApiOperation({ summary: 'Vincula veículo ao acordo' })
  linkVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkVehicleDto,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.service.linkVehicle(id, dto, user);
  }

  @Delete(':id/vehicles/:itemId')
  @ApiOperation({
    summary: 'Desvincula veículo (preserva histórico financeiro)',
  })
  unlinkVehicle(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.service.unlinkVehicle(id, itemId, user);
  }
}
