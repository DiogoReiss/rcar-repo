import { IsString, IsEmail, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ enum: CustomerType })
  @IsEnum(CustomerType)
  tipo: CustomerType;

  @ApiProperty({ example: 'Maria Santos' })
  @IsString()
  nome: string;

  @ApiProperty({ example: '123.456.789-00' })
  @IsString()
  cpfCnpj: string;

  @ApiPropertyOptional({ example: 'maria@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '(11) 99999-0000' })
  @IsString()
  @IsOptional()
  telefone?: string;

  // PF
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  cnh?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  cnhValidade?: string;

  @ApiPropertyOptional({
    example: 'customers/8cf6dcec-c5b0-4f95-b4f5-cnh-frente.jpg',
    description: 'Chave do arquivo de CNH armazenado no bucket',
  })
  @IsString()
  @IsOptional()
  cnhUrl?: string;

  // PJ
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  razaoSocial?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  responsavel?: string;
}

