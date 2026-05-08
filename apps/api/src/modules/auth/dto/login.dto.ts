import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@rcar.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'mudar123' })
  @IsString()
  @MinLength(8) // S10: NIST SP 800-63B minimum 8 chars
  senha: string;
}
