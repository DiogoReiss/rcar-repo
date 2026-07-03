import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
import { SignaturesService } from './signatures.service.js';

@ApiTags('Signatures')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('signatures')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Get('contracts/:id')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Status de assinatura do contrato' })
  getStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.signaturesService.getStatus(id);
  }

  @Get('contracts/:id/document')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA', 'CLIENTE')
  @ApiOperation({
    summary: 'URL assinada do documento assinado (admin e portal cliente)',
  })
  getDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.signaturesService.getSignedDocumentUrl(id);
  }

  @Post('contracts/:id/send')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Envia o contrato para assinatura digital (gera PDF + porta)',
  })
  send(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.signaturesService.sendForSignature(id, user);
  }

  @Post('contracts/:id/resend')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenvia a solicitação de assinatura pendente' })
  resend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.signaturesService.resend(id, user);
  }

  @Delete('contracts/:id')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Cancela a solicitação de assinatura pendente' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id?: string; role?: string },
  ) {
    return this.signaturesService.cancel(id, user);
  }
}
