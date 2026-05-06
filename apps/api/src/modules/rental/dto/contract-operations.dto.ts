import { IsString, IsNumber, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

export class CheckAvailabilityDto {
  @ApiProperty()
  dataRetirada: string;

  @ApiProperty()
  dataDevolucao: string;
}

