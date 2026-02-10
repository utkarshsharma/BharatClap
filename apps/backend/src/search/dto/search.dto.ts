import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class AiSearchDto {
  @ApiProperty({
    description: 'Natural language search query',
    example: 'I need a plumber to fix my tap tomorrow morning',
    minLength: 3,
    maxLength: 500,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  query: string;
}

export class TextSearchDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Text search query',
    example: 'plumber',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  q: string;
}
