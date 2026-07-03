import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateOperationalUnitDto {
  @IsString()
  @MinLength(2)
  nome!: string;

  @IsString()
  @MinLength(2)
  codigo!: string;

  @IsOptional()
  @IsObject()
  endereco?: Record<string, unknown>;
}

export class UpdateOperationalUnitDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nome?: string;

  @IsOptional()
  @IsObject()
  endereco?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
