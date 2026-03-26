/**
 * DTO para eventos de tracking do frontend
 */
import { IsString, IsOptional, IsBoolean, IsObject, MaxLength, IsUUID, ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class TrackEventDto {
  @IsString()
  @MaxLength(100)
  eventName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @IsOptional()
  @IsObject()
  params?: Record<string, string | number | boolean>;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pageName?: string;

  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  resourceName?: string;

  @IsOptional()
  @IsBoolean()
  success?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  errorMessage?: string;
}

export class TrackPageViewDto {
  @IsString()
  @MaxLength(100)
  pageName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pageUrl?: string;
}

export class TrackBatchEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(100)
  @Type(() => TrackEventDto)
  events!: TrackEventDto[];
}
