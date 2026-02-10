import { IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddProviderServiceDto {
  @ApiProperty({ description: 'Service ID (UUID)', format: 'uuid' })
  @IsString()
  @IsUUID()
  serviceId: string;

  @ApiProperty({ description: 'Custom price in paise (100 paise = ₹1)', minimum: 100 })
  @IsNumber()
  @Min(100)
  customPrice: number;
}

export class UpdateProviderServiceDto {
  @ApiProperty({ description: 'Custom price in paise (100 paise = ₹1)', minimum: 100 })
  @IsNumber()
  @Min(100)
  customPrice: number;
}
