import {
  Controller,
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
}
