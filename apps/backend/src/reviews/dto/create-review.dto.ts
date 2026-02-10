import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: 'Punctuality rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  ratingPunctuality: number;

  @ApiProperty({
    description: 'Quality rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  ratingQuality: number;

  @ApiProperty({
    description: 'Behavior rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  ratingBehavior: number;

  @ApiProperty({
    description: 'Value for money rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  ratingValue: number;

  @ApiPropertyOptional({
    description: 'Review comment',
    maxLength: 2000,
    example: 'Excellent service! The performer was on time and very professional.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs (maximum 5)',
    type: [String],
    maxItems: 5,
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  photos?: string[];
}
