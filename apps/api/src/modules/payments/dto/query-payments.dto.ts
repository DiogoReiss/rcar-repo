import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod, PaymentRefType, PaymentStatus } from '@prisma/client';

export class QueryPaymentsDto {
  @ApiPropertyOptional({ example: '2026-05-01' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-05-31' })
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ enum: PaymentRefType })
  @IsOptional()
  @IsEnum(PaymentRefType)
  refType?: PaymentRefType;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  metodo?: PaymentMethod;
}
