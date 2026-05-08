import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetSignedUrlQueryDto {
  @ApiProperty({
    example: 'documents/7ab2f8ef1a-vistoria-chegadajpg',
    description: 'Chave do objeto no bucket',
  })
  @IsString()
  objectKey!: string;

  @ApiPropertyOptional({
    example: 'vistoria-chegada.jpg',
    description: 'Nome sugerido para download',
  })
  @IsOptional()
  @IsString()
  downloadName?: string;

  @ApiPropertyOptional({
    example: 600,
    description: 'Tempo de expiração da URL assinada em segundos (máx. 1h)',
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  expiresInSeconds?: number;
}
