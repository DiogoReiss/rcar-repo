import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaymentsService } from './payments.service.js';
import { QueryPaymentsDto } from './dto/query-payments.dto.js';
import { CreateChargeDto } from './dto/create-charge.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('charges')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inicia cobrança online (Pix) sobre um recurso pagável',
  })
  startCharge(
    @Body() dto: CreateChargeDto,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.paymentsService.startCharge(dto, user);
  }

  @Get('charges/:id')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Status de uma cobrança' })
  findCharge(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findCharge(id);
  }

  @Get()
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({
    summary: 'Lista pagamentos com filtros globais (financeiro)',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-05-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-05-31' })
  @ApiQuery({ name: 'refType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'metodo', required: false })
  findAll(
    @Query() query: QueryPaymentsDto,
    @Query() pagination?: PaginationDto,
  ) {
    return this.paymentsService.findAll(query, pagination);
  }

  @Get('method-summary')
  @Roles('GESTOR_GERAL')
  @ApiOperation({
    summary:
      'Resumo financeiro por método de pagamento (valor, quantidade, percentual)',
  })
  @ApiQuery({ name: 'from', required: false, example: '2026-05-01' })
  @ApiQuery({ name: 'to', required: false, example: '2026-05-31' })
  @ApiQuery({ name: 'status', required: false, example: 'CONFIRMADO' })
  @ApiQuery({ name: 'refType', required: false })
  methodSummary(@Query() query: QueryPaymentsDto) {
    return this.paymentsService.methodSummary(query);
  }

  @Get('reconciliation')
  @Roles('GESTOR_GERAL')
  @ApiOperation({
    summary: 'Reconciliação de pagamentos pendentes há mais de N dias',
  })
  @ApiQuery({ name: 'days', required: false, type: Number, example: 7 })
  reconciliation(@Query('days') days?: number) {
    return this.paymentsService.reconciliation(Number(days ?? 7));
  }
}
