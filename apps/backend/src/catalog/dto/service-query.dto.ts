import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum ServiceSortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  POPULAR = 'popular',
  NEWEST = 'newest',
}

export class ServiceQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by category slug',
    example: 'plumbing',
  })
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ServiceSortOption,
    example: ServiceSortOption.PRICE_ASC,
  })
  @IsOptional()
  @IsEnum(ServiceSortOption)
  sort?: ServiceSortOption;

  @ApiPropertyOptional({
    description: 'Minimum price in rupees',
    example: 100,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum price in rupees',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}
