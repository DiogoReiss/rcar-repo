import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { PaymentWebhookDto } from './dto/payment-webhook.dto.js';

/**
 * Public webhook endpoint for the payment gateway (Pagar.me) callback. Not
 * behind JwtAuthGuard — authentication is via the HMAC signature header,
 * verified in the service. Processing is idempotent.
 */
@ApiTags('Payments')
@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback do gateway de pagamento (HMAC, idempotente)',
  })
  handle(
    @Body() dto: PaymentWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook(dto, signature);
  }
}
