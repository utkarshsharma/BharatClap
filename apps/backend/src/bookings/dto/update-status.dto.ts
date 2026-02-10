import { IsString, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Reason for cancellation',
    example: 'Schedule conflict',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class RejectBookingDto {
  @ApiProperty({
    description: 'Reason for rejection',
    example: 'Not available at the requested time',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  reason: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: '4-digit OTP code',
    example: '1234',
  })
  @IsString()
  @Matches(/^[0-9]{4}$/, {
    message: 'OTP code must be exactly 4 digits',
  })
  otpCode: string;
}
