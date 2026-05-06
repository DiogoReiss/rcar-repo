import { IsString, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiPropertyOptional({ description: 'ID do cliente cadastrado (ou use nomeAvulso)' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nomeAvulso?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ example: 'uuid-do-servico' })
  @IsUUID()
  serviceId: string;

  @ApiProperty({ example: '2026-05-10T09:00:00.000Z' })
  @IsDateString()
  dataHora: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacoes?: string;
}

