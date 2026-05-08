import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { WashScheduleStatus } from '@prisma/client';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ enum: WashScheduleStatus })
  @IsEnum(WashScheduleStatus)
  @IsOptional()
  status?: WashScheduleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  observacoes?: string;
}
