import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsArray,
  IsOptional,
  ArrayMaxSize,
} from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({
    description: 'Evidence text from the customer',
    example: 'The service was not completed as promised.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  evidenceText: string;

  @ApiPropertyOptional({
    description: 'Array of evidence photo URLs (max 5)',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    type: [String],
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  evidencePhotos?: string[];
}

export class RespondDisputeDto {
  @ApiProperty({
    description: 'Evidence text from the provider',
    example: 'The service was completed as per the requirements.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  evidenceText: string;

  @ApiPropertyOptional({
    description: 'Array of evidence photo URLs (max 5)',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    type: [String],
    maxItems: 5,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  evidencePhotos?: string[];
}
