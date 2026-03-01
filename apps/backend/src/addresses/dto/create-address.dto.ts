import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  MinLength,
  MaxLength,
  Matches,
  Min,
  Max,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    description: 'Address label (e.g., Home, Office)',
    example: 'Home',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  label: string;

  @ApiProperty({
    description: 'Full address line',
    example: 'Flat 301, Building A, Green Park Society',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  addressLine: string;

  @ApiPropertyOptional({
    description: 'Landmark near the address',
    example: 'Near HDFC Bank',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiProperty({
    description: 'City',
    example: 'Mumbai',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({
    description: 'PIN code (6 digits)',
    example: '400001',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'Pincode must be exactly 6 digits',
  })
  pincode: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate (auto-geocoded if not provided)',
    example: 19.076,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate (auto-geocoded if not provided)',
    example: 72.8777,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
