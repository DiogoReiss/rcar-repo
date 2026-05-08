import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ContractIncidentDto {
  @ApiProperty({ example: 'AVARIA' })
  @IsString()
  tipo: string;

  @ApiProperty({ example: 'Risco no para-choque traseiro' })
  @IsString()
  descricao: string;

  @ApiPropertyOptional({ example: 180 })
  @IsNumber()
  @IsOptional()
  valor?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  cobradoCliente?: boolean;
}

export class OpenContractDto {
  @ApiProperty({ description: 'KM no momento da retirada' })
  @IsInt()
  @Min(0)
  kmRetirada: number;

  @ApiPropertyOptional({ description: 'Nível de combustível na saída', example: 'CHEIO' })
  @IsString()
  @IsOptional()
  combustivelSaida?: string;

  @ApiPropertyOptional({ description: 'Checklist de vistoria de saída (JSON)' })
  @IsOptional()
  checklist?: Record<string, unknown>;
}

export class CloseContractDto {
  @ApiProperty({ description: 'KM na devolução' })
  @IsInt()
  @Min(0)
  kmDevolucao: number;

  @ApiPropertyOptional({ example: 'CHEIO' })
  @IsString()
  @IsOptional()
  combustivelChegada?: string;

  @ApiPropertyOptional()
  @IsOptional()
  checklist?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  observacoes?: string;

  @ApiPropertyOptional({
    type: [Object],
    description: 'Incidentes registrados na devolução (avaria, multa, km excedente, etc.)',
  })
  @IsOptional()
  incidents?: ContractIncidentDto[];
}

export class CheckAvailabilityDto {
  @ApiProperty()
  dataRetirada: string;

  @ApiProperty()
  dataDevolucao: string;
}

