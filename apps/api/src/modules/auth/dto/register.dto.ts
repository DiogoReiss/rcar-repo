import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Maria Souza' })
  @IsString()
  @MinLength(2)
  nome: string;

  @ApiProperty({ example: 'maria@rcar.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha1234' })
  @IsString()
  @MinLength(8)
  senha: string;
}
