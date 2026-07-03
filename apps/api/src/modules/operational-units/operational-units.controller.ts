import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { OperationalUnitsService } from './operational-units.service.js';
import {
  CreateOperationalUnitDto,
  UpdateOperationalUnitDto,
} from './dto/operational-unit.dto.js';

interface ActingUser {
  id?: string;
  role?: string;
  unidadeId?: string | null;
}

/** Base multi-unidade: unidades operacionais para segmentação de dados. */
@ApiTags('Operational Units')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operational-units')
export class OperationalUnitsController {
  constructor(private readonly service: OperationalUnitsService) {}

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cria unidade operacional (gestor geral)' })
  create(
    @Body() dto: CreateOperationalUnitDto,
    @CurrentUser() user: ActingUser,
  ) {
    return this.service.create(dto, user);
  }

  @Get()
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Lista unidades (escopo por unidade do usuário)' })
  findAll(@CurrentUser() user: ActingUser) {
    return this.service.findAll(user);
  }

  @Get(':id')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Detalhe de unidade operacional' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza unidade operacional (gestor geral)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOperationalUnitDto,
    @CurrentUser() user: ActingUser,
  ) {
    return this.service.update(id, dto, user);
  }
}
