import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsPositive, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentRefType } from '@prisma/client';

/** Online charge methods supported by the gateway port. */
export const GATEWAY_METHODS = ['PIX', 'CARTAO_CREDITO', 'BOLETO'] as const;
export type GatewayMethodDto = (typeof GATEWAY_METHODS)[number];

export class CreateChargeDto {
  @ApiProperty({ enum: PaymentRefType })
  @IsEnum(PaymentRefType)
  refType!: PaymentRefType;

  @ApiProperty({
    description: 'Id do recurso pagável (contrato/agendamento/fila)',
  })
  @IsUUID()
  refId!: string;

  @ApiPropertyOptional({ enum: GATEWAY_METHODS, default: 'PIX' })
  @IsOptional()
  @IsIn(GATEWAY_METHODS)
  metodo?: GatewayMethodDto;

  @ApiPropertyOptional({ description: 'Token do cartão (CARTAO_CREDITO)' })
  @IsOptional()
  cardToken?: string;

  @ApiPropertyOptional({ description: 'Vencimento do boleto (ISO)' })
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description:
      'Valor parcial a cobrar (BRL). Se omitido, cobra o saldo em aberto.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  valor?: number;
}
