import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        providerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
      },
      include: {
        providerProfile: true,
      },
    });

    this.logger.log(`User profile updated: ${userId}`);

    return updatedUser;
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        phone: `deleted_${userId}`,
        name: null,
        email: null,
        avatarUrl: null,
      },
    });

    this.logger.log(`User account deleted (soft): ${userId}`);

    return { message: 'Account deleted successfully' };
  }

  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providerProfile: true,
        addresses: true,
        bookingsAsCustomer: {
          include: {
            service: true,
            provider: true,
          },
        },
        bookingsAsProvider: {
          include: {
            service: true,
            customer: true,
          },
        },
        reviewsGiven: {
          include: {
            booking: true,
          },
        },
        reviewsReceived: {
          include: {
            booking: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Data export requested for user: ${userId}`);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        firebaseUid: user.firebaseUid,
        preferredLanguage: user.preferredLanguage,
        city: user.city,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      providerProfile: user.providerProfile,
      addresses: user.addresses,
      bookings: user.bookingsAsCustomer,
      providedBookings: user.bookingsAsProvider,
      reviews: user.reviewsGiven,
      receivedReviews: user.reviewsReceived,
    };
  }
}
