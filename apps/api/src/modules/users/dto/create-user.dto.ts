import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'joao@rcar.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 8 })
  @IsString()
  @MinLength(8) // S10: NIST SP 800-63B minimum 8 chars
  senha: string;

  @ApiProperty({ enum: UserRole, example: 'OPERADOR' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    type: [String],
    description: 'Features for internal users',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];
}
