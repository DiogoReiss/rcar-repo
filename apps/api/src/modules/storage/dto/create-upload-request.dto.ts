import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsMimeType,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateUploadRequestDto {
  @ApiProperty({
    example: 'vistoria-chegada.jpg',
    description: 'Nome original do arquivo',
  })
  @IsString()
  @MaxLength(180)
  fileName!: string;

  @ApiProperty({ example: 'image/jpeg', description: 'MIME type do arquivo' })
  @IsMimeType()
  contentType!: string;

  @ApiPropertyOptional({
    example: 'inspections',
    description:
      'Pasta lógica para organização (ex.: inspections, customers, contracts)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  folder?: string;

  @ApiPropertyOptional({
    example: 900,
    description: 'Tempo de expiração da URL de upload em segundos (máx. 1h)',
  })
  @IsOptional()
  @IsInt()
  @Min(60)
  @Max(3600)
  expiresInSeconds?: number;
}
