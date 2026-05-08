import {
  Controller,
  Get,
  Post,
  Patch,
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
import { ContractStatus } from '@prisma/client';
import { RentalService } from './rental.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';
import {
  OpenContractDto,
  CloseContractDto,
} from './dto/contract-operations.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Rental')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rental')
export class RentalController {
  constructor(private readonly rentalService: RentalService) {}

  // ─── Availability ──────────────────────────────────────────────────────────

  @Get('available')
  @ApiOperation({ summary: 'Veículos disponíveis para o período' })
  @ApiQuery({
    name: 'dataRetirada',
    required: true,
    example: '2026-05-10T08:00:00Z',
  })
  @ApiQuery({
    name: 'dataDevolucao',
    required: true,
    example: '2026-05-15T08:00:00Z',
  })
  checkAvailability(
    @Query('dataRetirada') dr: string,
    @Query('dataDevolucao') dd: string,
  ) {
    return this.rentalService.checkAvailability(dr, dd);
  }

  // ─── Contracts ─────────────────────────────────────────────────────────────

  @Get('contracts')
  @ApiOperation({ summary: 'Lista contratos (paginado)' })
  @ApiQuery({ name: 'status', enum: ContractStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  findAll(
    @Query('status') status?: ContractStatus,
    @Query('customerId') customerId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.rentalService.findAll(status, customerId, pagination);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Detalhe do contrato' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalService.findOne(id);
  }

  @Post('contracts')
  @ApiOperation({ summary: 'Cria reserva/contrato' })
  create(@Body() dto: CreateContractDto) {
    return this.rentalService.create(dto);
  }

  @Patch('contracts/:id/open')
  @ApiOperation({
    summary: 'Abre contrato — vistoria de saída e marca veículo como ALUGADO',
  })
  openContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: OpenContractDto,
  ) {
    return this.rentalService.openContract(id, dto);
  }

  @Patch('contracts/:id/close')
  @ApiOperation({
    summary: 'Encerra contrato — vistoria de chegada e devolução',
  })
  closeContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CloseContractDto,
  ) {
    return this.rentalService.closeContract(id, dto);
  }

  @Patch('contracts/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela reserva' })
  cancelContract(@Param('id', ParseUUIDPipe) id: string) {
    return this.rentalService.cancelContract(id);
  }

  @Post('contracts/:id/payment')
  @ApiOperation({ summary: 'Registra pagamento do contrato' })
  pay(@Param('id', ParseUUIDPipe) id: string, @Body() dto: { metodo: string }) {
    return this.rentalService.registerPayment(
      id,
      dto.metodo as import('@prisma/client').PaymentMethod,
    );
  }
}
