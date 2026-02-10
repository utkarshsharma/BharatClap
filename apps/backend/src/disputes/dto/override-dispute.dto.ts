import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional, IsNumber, Min } from 'class-validator';

export class OverrideDisputeDto {
  @ApiProperty({
    description: 'Admin override ruling text',
    example: 'After reviewing all evidence, the customer claim is valid.',
  })
  @IsString()
  @IsNotEmpty()
  ruling: string;

  @ApiProperty({
    description: 'Who the ruling is in favor of',
    example: 'customer',
    enum: ['customer', 'provider'],
  })
  @IsString()
  @IsIn(['customer', 'provider'])
  inFavor: 'customer' | 'provider';

  @ApiPropertyOptional({
    description: 'Refund amount in paise',
    example: 50000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number;
}
