import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMaintenanceDto {
  @ApiProperty({ description: 'Descrição do serviço de manutenção' })
  @IsString()
  descricao: string;

  @ApiProperty({ description: 'Custo da manutenção em R$', example: 850.00 })
  @IsNumber()
  @Min(0)
  custo: number;

  @ApiProperty({ description: 'Data da manutenção (ISO string)', example: '2026-05-07T00:00:00Z' })
  @IsDateString()
  data: string;

  @ApiPropertyOptional({ description: 'Se true, altera o status do veículo para MANUTENCAO', default: false })
  @IsOptional()
  @IsBoolean()
  setMantencao?: boolean;
}

