import { IsString, IsInt, IsEnum, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleCategory, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 'ABC-1234' })
  @IsString()
  placa: string;

  @ApiProperty({ example: 'Toyota Corolla' })
  @IsString()
  modelo: string;

  @ApiProperty({ example: 2023 })
  @IsInt()
  @Min(2000)
  ano: number;

  @ApiProperty({ example: 'Prata' })
  @IsString()
  cor: string;

  @ApiProperty({ enum: VehicleCategory })
  @IsEnum(VehicleCategory)
  categoria: VehicleCategory;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  fotos?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  kmAtual?: number;
}

