import { IsString, IsUUID, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecurringFreq } from '@prisma/client';

export class CreateRecurringDto {
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
    description: 'Recurring frequency',
    enum: RecurringFreq,
    example: RecurringFreq.WEEKLY,
  })
  @IsEnum(RecurringFreq)
  frequency: RecurringFreq;

  @ApiProperty({
    description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Preferred hour (24-hour format, 8-21)',
    example: 14,
    minimum: 8,
    maximum: 21,
  })
  @IsInt()
  @Min(8)
  @Max(21)
  preferredHour: number;
}
