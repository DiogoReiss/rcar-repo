import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RentalModality } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty()
  @IsUUID()
  customerId: string;

  @ApiProperty()
  @IsUUID()
  vehicleId: string;

  @ApiProperty({ enum: RentalModality })
  @IsEnum(RentalModality)
  modalidade: RentalModality;

  @ApiProperty({ example: '2026-05-10T08:00:00.000Z' })
  @IsDateString()
  dataRetirada: string;

  @ApiProperty({ example: '2026-05-15T08:00:00.000Z' })
  @IsDateString()
  dataDevolucao: string;

  @ApiProperty({ example: 120.0 })
  @IsNumber()
  @Min(0)
  valorDiaria: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  seguro?: boolean;

  @ApiPropertyOptional({ example: 25.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  valorSeguro?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  kmLimite?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacoes?: string;
}
