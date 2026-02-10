import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RegisterDeviceDto {
  @ApiProperty({
    description: 'FCM device token',
    example: 'fGxY8qZ1R2e...',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @ApiPropertyOptional({
    description: 'Device platform',
    example: 'android',
    enum: ['ios', 'android'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ios', 'android'])
  platform?: 'ios' | 'android';
}
