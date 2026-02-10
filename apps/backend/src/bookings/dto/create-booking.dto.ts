import { IsString, IsUUID, IsInt, Min, Max, IsOptional, MaxLength, Matches, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Service UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  serviceId: string;

  @ApiProperty({
    description: 'Provider UUID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  providerId: string;

  @ApiProperty({
    description: 'Address UUID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4')
  addressId: string;

  @ApiProperty({
    description: 'Scheduled date in ISO format (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({
    description: 'Scheduled hour (24-hour format, 8-21)',
    example: 14,
    minimum: 8,
    maximum: 21,
  })
  @IsInt()
  @Min(8)
  @Max(21)
  scheduledHour: number;

  @ApiPropertyOptional({
    description: 'Customer notes for the booking',
    example: 'Please bring cleaning supplies',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNotes?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact name',
    example: 'Rajesh Kumar',
  })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({
    description: 'Emergency contact phone (10 digits)',
    example: '9876543210',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Emergency contact phone must be exactly 10 digits',
  })
  emergencyContactPhone?: string;
}
