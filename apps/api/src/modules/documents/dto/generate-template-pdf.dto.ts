import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class GenerateTemplatePdfDto {
  @ApiProperty({
    description: 'Dados usados para preencher variáveis do template (Handlebars)',
    example: { nomeCliente: 'Carlos Andrade', placa: 'ABC-1234', valorTotal: '720,00' },
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  variables!: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Nome opcional do arquivo gerado sem extensão',
    example: 'contrato-locacao-abc-1234',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fileName?: string;
}

