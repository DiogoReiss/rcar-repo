import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Shampoo Automotivo' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ example: 'Shampoo concentrado para lavagem externa' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ example: 'litro' })
  @IsString()
  unidade: string;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  quantidadeAtual: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(0)
  estoqueMinimo: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  custoUnitario?: number;
}
