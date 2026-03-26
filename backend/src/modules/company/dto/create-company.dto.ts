import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  document?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}
