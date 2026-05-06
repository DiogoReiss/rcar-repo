import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'joao@rcar.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  senha: string;

  @ApiProperty({ enum: UserRole, example: 'OPERADOR' })
  @IsEnum(UserRole)
  role: UserRole;
}

