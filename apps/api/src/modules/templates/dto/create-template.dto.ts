import { IsString, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TemplateType } from '@prisma/client';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty({ enum: TemplateType })
  @IsEnum(TemplateType)
  tipo: TemplateType;

  @ApiProperty({
    description: 'Conteúdo HTML com variáveis Handlebars {{variavel}}',
  })
  @IsString()
  conteudoHtml: string;

  @ApiProperty({
    type: [String],
    description: 'Lista de variáveis disponíveis',
    example: ['clienteNome', 'valorTotal'],
  })
  @IsArray()
  @IsString({ each: true })
  variaveis: string[];
}
