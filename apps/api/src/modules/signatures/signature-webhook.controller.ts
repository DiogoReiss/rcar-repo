import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SignaturesService } from './signatures.service.js';
import { SignatureWebhookDto } from './dto/signature-webhook.dto.js';

/**
 * Public webhook endpoint for the signature provider callback. Not behind
 * JwtAuthGuard — authentication is via the HMAC signature header, verified in
 * the service. Processing is idempotent.
 */
@ApiTags('Signatures')
@Controller('signatures/webhook')
export class SignatureWebhookController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Callback do provedor de assinatura (HMAC, idempotente)',
  })
  handle(
    @Body() dto: SignatureWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ) {
    return this.signaturesService.handleWebhook(dto, signature);
  }
}
