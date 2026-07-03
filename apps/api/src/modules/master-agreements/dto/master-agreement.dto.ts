import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BillingCycle } from '@prisma/client';

export class AgreementItemDto {
  @ApiProperty()
  @IsUUID()
  vehicleId!: string;

  @ApiProperty({ example: 1200 })
  @IsNumber()
  @Min(0)
  valorCiclo!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  contractId?: string;
}

export class CreateMasterAgreementDto {
  @ApiProperty()
  @IsUUID()
  customerId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiProperty({ enum: BillingCycle })
  @IsEnum(BillingCycle)
  ciclo!: BillingCycle;

  @ApiPropertyOptional({ minimum: 1, maximum: 31 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  diaVencimento?: number;

  @ApiPropertyOptional({ type: [AgreementItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgreementItemDto)
  items?: AgreementItemDto[];
}

export class LinkVehicleDto extends AgreementItemDto {}
