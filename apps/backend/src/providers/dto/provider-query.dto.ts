import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export enum ProviderSortOption {
  RATING = 'rating',
  DISTANCE = 'distance',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
}

export class ProviderQueryDto extends PaginationDto {
  @ApiProperty({ description: 'Service ID to filter providers', format: 'uuid' })
  @IsString()
  @IsUUID()
  serviceId: string;

  @ApiPropertyOptional({ description: 'Latitude for distance calculation' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({ description: 'Longitude for distance calculation' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({ description: 'Sort option', enum: ProviderSortOption })
  @IsOptional()
  @IsEnum(ProviderSortOption)
  sort?: ProviderSortOption;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;
}
