import { IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWashServiceDto {
  @ApiProperty({ example: 'Lavagem Simples' })
  @IsString()
  nome: string;

  @ApiPropertyOptional({ example: 'Lavagem externa completa com secagem' })
  @IsString()
  @IsOptional()
  descricao?: string;

  @ApiProperty({ example: 40.0 })
  @IsNumber()
  @Min(0)
  preco: number;

  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(5)
  duracaoMin: number;
}

