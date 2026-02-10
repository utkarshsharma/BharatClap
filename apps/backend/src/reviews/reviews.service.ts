import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private prisma: PrismaService) {}

  async createReview(customerId: string, bookingId: string, dto: CreateReviewDto) {
    // Verify booking exists and is COMPLETED
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new ConflictException('Review already exists for this booking');
    }

    // Calculate overall rating as average of 4 dimensions (rounded)
    const ratingOverall = Math.round(
      (dto.ratingPunctuality + dto.ratingQuality + dto.ratingBehavior + dto.ratingValue) / 4,
    );

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        customerId,
        providerId: booking.providerId!,
        ratingOverall,
        ratingPunctuality: dto.ratingPunctuality,
        ratingQuality: dto.ratingQuality,
        ratingBehavior: dto.ratingBehavior,
        ratingValue: dto.ratingValue,
        comment: dto.comment,
        photos: dto.photos || [],
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update provider's aggregate ratings and increment totalJobs
    await this.updateProviderAggregateRatings(booking.providerId!);

    this.logger.log(`Created review for booking: ${bookingId}`);

    return review;
  }

  async getProviderReviews(
    providerId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    // Verify provider exists
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { providerId },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { providerId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateProviderAggregateRatings(providerId: string) {
    // Get all reviews for this provider
    const reviews = await this.prisma.review.findMany({
      where: { providerId },
      select: {
        ratingOverall: true,
        ratingPunctuality: true,
        ratingQuality: true,
        ratingBehavior: true,
        ratingValue: true,
      },
    });

    if (reviews.length === 0) {
      // No reviews yet, set all to 0
      await this.prisma.providerProfile.update({
        where: { id: providerId },
        data: {
          avgRating: 0,
          avgPunctuality: 0,
          avgQuality: 0,
          avgBehavior: 0,
          avgValue: 0,
          totalJobs: 0,
        },
      });
      return;
    }

    // Calculate averages
    const totalReviews = reviews.length;
    const sumOverall = reviews.reduce((sum, r) => sum + r.ratingOverall, 0);
    const sumPunctuality = reviews.reduce((sum, r) => sum + r.ratingPunctuality, 0);
    const sumQuality = reviews.reduce((sum, r) => sum + r.ratingQuality, 0);
    const sumBehavior = reviews.reduce((sum, r) => sum + r.ratingBehavior, 0);
    const sumValue = reviews.reduce((sum, r) => sum + r.ratingValue, 0);

    const avgRating = sumOverall / totalReviews;
    const avgPunctuality = sumPunctuality / totalReviews;
    const avgQuality = sumQuality / totalReviews;
    const avgBehavior = sumBehavior / totalReviews;
    const avgValue = sumValue / totalReviews;

    // Update provider profile
    await this.prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        avgRating,
        avgPunctuality,
        avgQuality,
        avgBehavior,
        avgValue,
        totalJobs: totalReviews,
      },
    });

    this.logger.log(`Updated aggregate ratings for provider: ${providerId}`);
  }
}
