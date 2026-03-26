import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  ValidateNested,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

class UtmDto {
  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  medium?: string;

  @IsString()
  @IsOptional()
  campaign?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  term?: string;
}

class ScreenDto {
  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;
}

export class TrackAnalyticsEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  sessionId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  visitorId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  eventName!: string;

  @IsObject()
  @IsOptional()
  eventData?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  page?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  referrer?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  hostname?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  scanId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  funnelVariant?: string;

  @ValidateNested()
  @Type(() => UtmDto)
  @IsOptional()
  utm?: UtmDto;

  @ValidateNested()
  @Type(() => ScreenDto)
  @IsOptional()
  screen?: ScreenDto;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  language?: string;
}
