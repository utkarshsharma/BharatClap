import { IsInt, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { RecurringFreq } from '@prisma/client';

export class UpdateRecurringDto {
  @ApiPropertyOptional({
    description: 'Recurring frequency',
    enum: RecurringFreq,
    example: RecurringFreq.BIWEEKLY,
  })
  @IsOptional()
  @IsEnum(RecurringFreq)
  frequency?: RecurringFreq;

  @ApiPropertyOptional({
    description: 'Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
    example: 2,
    minimum: 0,
    maximum: 6,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @ApiPropertyOptional({
    description: 'Preferred hour (24-hour format, 8-21)',
    example: 15,
    minimum: 8,
    maximum: 21,
  })
  @IsOptional()
  @IsInt()
  @Min(8)
  @Max(21)
  preferredHour?: number;
}
