import {
  Controller,
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
import { BillingService } from './billing.service.js';

/** Recurring consolidated billing — manager-only (GESTOR_GERAL). */
@ApiTags('Master Agreements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL')
@Controller('master-agreements')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('billing/run')
  @ApiOperation({
    summary: 'Executa o ciclo de cobrança recorrente consolidada',
  })
  runCycle(@CurrentUser() user: { id?: string; role?: string }) {
    return this.billing.runCycle(new Date(), user);
  }

  @Get('billing/reconciliation')
  @ApiOperation({
    summary: 'Reconciliação: cobranças consolidadas x contratos-filho',
  })
  reconciliation() {
    return this.billing.reconciliation();
  }

  @Get(':id/billing/preview')
  @ApiOperation({ summary: 'Prévia da fatura consolidada do próximo ciclo' })
  preview(@Param('id', ParseUUIDPipe) id: string) {
    return this.billing.previewInvoice(id);
  }

  @Post(':id/billing/charge')
  @ApiOperation({
    summary: 'Gera a fatura consolidada do ciclo atual do acordo',
  })
  charge(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.billing.chargeNow(id, user);
  }
}
