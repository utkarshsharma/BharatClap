import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, MaxLength, Min, Max, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProviderDto {
  @ApiPropertyOptional({ description: 'Provider bio', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  bio?: string;

  @ApiPropertyOptional({ description: 'Base latitude for service area' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  baseLatitude?: number;

  @ApiPropertyOptional({ description: 'Base longitude for service area' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLongitude?: number;

  @ApiPropertyOptional({ description: 'Service radius in kilometers', minimum: 1, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ description: 'Whether provider is currently available for bookings' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Years of experience', minimum: 0, maximum: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience?: number;

  @ApiPropertyOptional({ description: 'List of certifications', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Languages spoken by provider', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[];

  @ApiPropertyOptional({ description: 'URL to provider video introduction' })
  @IsOptional()
  @IsString()
  @IsUrl()
  videoIntroUrl?: string;
}
