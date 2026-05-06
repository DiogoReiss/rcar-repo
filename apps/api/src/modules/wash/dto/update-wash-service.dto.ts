import { PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateWashServiceDto } from './create-wash-service.dto.js';

export class UpdateWashServiceDto extends PartialType(CreateWashServiceDto) {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

