import { IsNumber, IsBoolean, IsArray, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AvailabilitySlotDto {
  @ApiProperty({ description: 'Day of week (0=Sunday, 6=Saturday)', minimum: 0, maximum: 6 })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({ description: 'Start hour (24-hour format)', minimum: 0, maximum: 23 })
  @IsNumber()
  @Min(0)
  @Max(23)
  startHour: number;

  @ApiProperty({ description: 'End hour (24-hour format)', minimum: 0, maximum: 23 })
  @IsNumber()
  @Min(0)
  @Max(23)
  endHour: number;

  @ApiProperty({ description: 'Whether this slot is active' })
  @IsBoolean()
  isActive: boolean;
}

export class SetAvailabilityDto {
  @ApiProperty({ description: 'Array of availability slots', type: [AvailabilitySlotDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
