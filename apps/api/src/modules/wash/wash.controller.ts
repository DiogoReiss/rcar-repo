import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lista serviços do lavajato (paginado)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  findAll(
    @Query('includeInactive') inc?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.washService.findAll(inc === 'true', {
      page: page ?? 1,
      perPage: perPage ?? 20,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do serviço' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.washService.findOne(id);
  }

  @Post()
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cria serviço' })
  create(@Body() dto: CreateWashServiceDto) {
    return this.washService.create(dto);
  }

  @Patch(':id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza serviço (inclui ativar/desativar)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWashServiceDto,
  ) {
    return this.washService.update(id, dto);
  }

  @Delete(':id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove (soft-delete) serviço' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.washService.remove(id);
  }
}
