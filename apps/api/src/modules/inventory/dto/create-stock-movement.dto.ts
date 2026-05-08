import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StockMovementTypeDto {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  AJUSTE = 'AJUSTE',
}

export class CreateStockMovementDto {
  @ApiProperty({ example: 'uuid-do-produto' })
  @IsString()
  productId: string;

  @ApiProperty({ enum: StockMovementTypeDto, example: 'ENTRADA' })
  @IsEnum(StockMovementTypeDto)
  tipo: StockMovementTypeDto;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @ApiPropertyOptional({ example: 'Compra de fornecedor X' })
  @IsString()
  @IsOptional()
  motivo?: string;

  @ApiPropertyOptional({
    example: 39.9,
    description:
      'Custo unitário da movimentação (obrigatório para ENTRADA quando quiser recalcular custo médio).',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  custoUnitario?: number;
}
