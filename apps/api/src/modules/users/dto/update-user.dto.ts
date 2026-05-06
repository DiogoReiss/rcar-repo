import { PartialType, OmitType } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['senha'] as const)) {
  @ApiPropertyOptional({ minLength: 6 })
  @IsString()
  @MinLength(6)
  @IsOptional()
  senha?: string;
}

