import { IsString, IsOptional, Matches, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBankDetailsDto {
  @ApiPropertyOptional({ description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccountNo?: string;

  @ApiPropertyOptional({ description: 'Bank IFSC code', pattern: '^[A-Z]{4}0[A-Z0-9]{6}$' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  bankIfsc?: string;

  @ApiPropertyOptional({ description: 'UPI ID' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ValidateIf((o) => !o.bankAccountNo && !o.bankIfsc && !o.upiId)
  @IsString({ message: 'At least one of bankAccountNo, bankIfsc, or upiId must be provided' })
  _atLeastOne?: string;
}
