import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class BookingQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status (comma-separated for multiple)',
    example: 'CONFIRMED,PROVIDER_ASSIGNED,IN_PROGRESS',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Role filter (customer or provider)',
    example: 'customer',
  })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings from this date (ISO format)',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings until this date (ISO format)',
    example: '2026-02-28',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
