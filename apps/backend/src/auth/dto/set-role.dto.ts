import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class SetRoleDto {
  @ApiProperty({
    description: 'User role - can only be CUSTOMER or PROVIDER',
    enum: ['CUSTOMER', 'PROVIDER'],
    example: 'CUSTOMER',
  })
  @IsEnum(['CUSTOMER', 'PROVIDER'], {
    message: 'Role must be either CUSTOMER or PROVIDER',
  })
  @IsNotEmpty()
  role: 'CUSTOMER' | 'PROVIDER';
}
