import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class BookingQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

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
