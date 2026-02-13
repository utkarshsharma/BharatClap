import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail, IsBoolean, MinLength, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User full name',
    example: 'Rajesh Kumar',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'rajesh.kumar@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://example.com/avatars/user123.jpg',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'User preferred language',
    example: 'hi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'User city',
    example: 'Mumbai',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Enable push notifications', example: true })
  @IsOptional()
  @IsBoolean()
  notifPush?: boolean;

  @ApiPropertyOptional({ description: 'Enable WhatsApp notifications', example: false })
  @IsOptional()
  @IsBoolean()
  notifWhatsapp?: boolean;

  @ApiPropertyOptional({ description: 'Enable booking update notifications', example: true })
  @IsOptional()
  @IsBoolean()
  notifBooking?: boolean;

  @ApiPropertyOptional({ description: 'Enable promotional notifications', example: true })
  @IsOptional()
  @IsBoolean()
  notifPromo?: boolean;
}
