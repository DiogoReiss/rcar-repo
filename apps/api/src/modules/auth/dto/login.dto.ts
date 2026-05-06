import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@rcar.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mudar123' })
  @IsString()
  @MinLength(6)
  senha: string;
}

