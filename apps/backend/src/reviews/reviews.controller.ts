import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('bookings/:id/review')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  @ApiResponse({
    status: 201,
    description: 'Review created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - booking not completed or invalid data',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - not your booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Review already exists for this booking',
  })
  async createReview(
    @CurrentUser('id') customerId: string,
    @Param('id') bookingId: string,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(customerId, bookingId, createReviewDto);
  }

  @Get('provider/:id')
  @Public()
  @ApiOperation({ summary: 'Get all reviews for a provider' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found',
  })
  async getProviderReviews(
    @Param('id') providerId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.reviewsService.getProviderReviews(providerId, page, limit);
  }
}
