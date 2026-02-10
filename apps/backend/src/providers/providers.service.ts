import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { AddProviderServiceDto, UpdateProviderServiceDto } from './dto/provider-service.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { UpdateBankDetailsDto } from './dto/bank-details.dto';
import { ProviderQueryDto, ProviderSortOption, PaginationDto } from './dto/provider-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  // Provider self-management methods

  async getOwnProfile(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          include: {
            service: {
              select: {
                id: true,
                name: true,
                categoryId: true,
                basePrice: true,
              },
            },
          },
        },
        portfolioItems: {
          orderBy: { sortOrder: 'asc' },
        },
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProviderDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.prisma.providerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async addService(userId: string, dto: AddProviderServiceDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    // Check if service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Check if provider already offers this service
    const existing = await this.prisma.providerService.findUnique({
      where: {
        providerId_serviceId: {
          providerId: profile.id,
          serviceId: dto.serviceId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Provider already offers this service');
    }

    return this.prisma.providerService.create({
      data: {
        providerId: profile.id,
        serviceId: dto.serviceId,
        customPrice: dto.customPrice,
        isActive: true,
      },
      include: {
        service: true,
      },
    });
  }

  async updateService(userId: string, providerServiceId: string, dto: UpdateProviderServiceDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const providerService = await this.prisma.providerService.findFirst({
      where: {
        id: providerServiceId,
        providerId: profile.id,
      },
    });

    if (!providerService) {
      throw new NotFoundException('Provider service not found');
    }

    return this.prisma.providerService.update({
      where: { id: providerServiceId },
      data: {
        customPrice: dto.customPrice,
      },
      include: {
        service: true,
      },
    });
  }

  async removeService(userId: string, providerServiceId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const providerService = await this.prisma.providerService.findFirst({
      where: {
        id: providerServiceId,
        providerId: profile.id,
      },
    });

    if (!providerService) {
      throw new NotFoundException('Provider service not found');
    }

    return this.prisma.providerService.update({
      where: { id: providerServiceId },
      data: { isActive: false },
    });
  }

  async getAvailability(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    return this.prisma.providerAvailability.findMany({
      where: { providerId: profile.id },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    // Validate slots
    for (const slot of dto.slots) {
      if (slot.endHour <= slot.startHour) {
        throw new BadRequestException(`Invalid time range for day ${slot.dayOfWeek}: end hour must be after start hour`);
      }
    }

    // Upsert all slots
    const operations = dto.slots.map((slot) =>
      this.prisma.providerAvailability.upsert({
        where: {
          providerId_dayOfWeek: {
            providerId: profile.id,
            dayOfWeek: slot.dayOfWeek,
          },
        },
        update: {
          startHour: slot.startHour,
          endHour: slot.endHour,
          isActive: slot.isActive,
        },
        create: {
          providerId: profile.id,
          dayOfWeek: slot.dayOfWeek,
          startHour: slot.startHour,
          endHour: slot.endHour,
          isActive: slot.isActive,
        },
      })
    );

    await this.prisma.$transaction(operations);

    return this.getAvailability(userId);
  }

  async addPortfolioItem(userId: string, mediaUrl: string, mediaType: string, caption?: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        portfolioItems: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const maxSortOrder = profile.portfolioItems.length > 0
      ? Math.max(...profile.portfolioItems.map((p) => p.sortOrder))
      : 0;

    return this.prisma.providerPortfolio.create({
      data: {
        providerId: profile.id,
        mediaUrl,
        mediaType,
        caption,
        sortOrder: maxSortOrder + 1,
      },
    });
  }

  async removePortfolioItem(userId: string, portfolioId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const portfolio = await this.prisma.providerPortfolio.findFirst({
      where: {
        id: portfolioId,
        providerId: profile.id,
      },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio item not found');
    }

    return this.prisma.providerPortfolio.delete({
      where: { id: portfolioId },
    });
  }

  async updateBankDetails(userId: string, dto: UpdateBankDetailsDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    if (!dto.bankAccountNo && !dto.bankIfsc && !dto.upiId) {
      throw new BadRequestException('At least one bank detail must be provided');
    }

    return this.prisma.providerProfile.update({
      where: { userId },
      data: {
        bankAccountNo: dto.bankAccountNo,
        bankIfsc: dto.bankIfsc,
        upiId: dto.upiId,
      },
      select: {
        bankAccountNo: true,
        bankIfsc: true,
        upiId: true,
      },
    });
  }

  async getEarnings(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    // Get total earnings from completed jobs
    const totalEarnings = profile.totalEarnings;
    const walletBalance = profile.walletBalance;

    // Get pending payouts
    const pendingPayouts = await this.prisma.payment.aggregate({
      where: {
        booking: {
          providerId: userId,
        },
        payoutStatus: 'PENDING',
      },
      _sum: {
        providerPayout: true,
      },
    });

    return {
      totalEarnings,
      walletBalance,
      pendingPayouts: pendingPayouts._sum?.providerPayout || 0,
      totalJobs: profile.totalJobs,
    };
  }

  async getPayouts(userId: string, pagination: PaginationDto) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          booking: {
            providerId: userId,
          },
          providerPayout: {
            gt: 0,
          },
        },
        include: {
          booking: {
            select: {
              id: true,
              scheduledDate: true,
              serviceId: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: {
          booking: {
            providerId: userId,
          },
          providerPayout: {
            gt: 0,
          },
        },
      }),
    ]);

    return {
      data: payouts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async requestWithdrawal(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    if (profile.walletBalance <= 0) {
      throw new BadRequestException('Insufficient balance for withdrawal');
    }

    if (!profile.bankAccountNo && !profile.upiId) {
      throw new BadRequestException('Bank details not set. Please update your bank or UPI information.');
    }

    // TODO: Implement actual withdrawal logic with payment gateway
    return {
      message: 'Withdrawal request submitted successfully',
      amount: profile.walletBalance,
      status: 'PENDING',
    };
  }

  // Customer-facing methods

  async findProviders(query: ProviderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: Prisma.ProviderProfileWhereInput = {
      providerServices: {
        some: {
          serviceId: query.serviceId,
          isActive: true,
        },
      },
      user: {
        isActive: true,
      },
    };

    // Base query
    let providers: any[] = await this.prisma.providerProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        providerServices: {
          where: {
            serviceId: query.serviceId,
            isActive: true,
          },
          include: {
            service: true,
          },
        },
      },
    });

    // Calculate distance if lat/lng provided
    if (query.lat !== undefined && query.lng !== undefined) {
      providers = providers.map((provider: any) => {
        if (provider.baseLatitude && provider.baseLongitude) {
          const distance = this.calculateDistance(
            query.lat!,
            query.lng!,
            provider.baseLatitude,
            provider.baseLongitude
          );
          return { ...provider, distance };
        }
        return { ...provider, distance: null };
      });

      // Filter by service radius
      providers = providers.filter((provider: any) => {
        if (provider.distance === null) return false;
        return provider.distance <= provider.serviceRadiusKm;
      });
    }

    // Sort
    switch (query.sort) {
      case ProviderSortOption.RATING:
        providers.sort((a: any, b: any) => (b.avgRating || 0) - (a.avgRating || 0));
        break;
      case ProviderSortOption.DISTANCE:
        if (query.lat !== undefined && query.lng !== undefined) {
          providers.sort((a: any, b: any) => {
            const distA = a.distance || Infinity;
            const distB = b.distance || Infinity;
            return distA - distB;
          });
        }
        break;
      case ProviderSortOption.PRICE_ASC:
        providers.sort((a: any, b: any) => {
          const priceA = a.providerServices[0]?.customPrice || Infinity;
          const priceB = b.providerServices[0]?.customPrice || Infinity;
          return priceA - priceB;
        });
        break;
      case ProviderSortOption.PRICE_DESC:
        providers.sort((a: any, b: any) => {
          const priceA = a.providerServices[0]?.customPrice || 0;
          const priceB = b.providerServices[0]?.customPrice || 0;
          return priceB - priceA;
        });
        break;
      default:
        providers.sort((a: any, b: any) => (b.avgRating || 0) - (a.avgRating || 0));
    }

    const total = providers.length;
    const paginatedProviders = providers.slice(skip, skip + limit);

    return {
      data: paginatedProviders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProviderPublicProfile(providerId: string) {
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          include: {
            service: {
              include: {
                category: true,
              },
            },
          },
        },
        portfolioItems: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    return provider;
  }

  async addFavorite(customerId: string, providerId: string) {
    // Verify provider exists
    const provider = await this.prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // Check if already favorited
    const existing = await this.prisma.favoriteProvider.findUnique({
      where: {
        customerId_providerId: {
          customerId,
          providerId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Provider already in favorites');
    }

    return this.prisma.favoriteProvider.create({
      data: {
        customerId,
        providerId,
      },
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async removeFavorite(customerId: string, providerId: string) {
    const favorite = await this.prisma.favoriteProvider.findUnique({
      where: {
        customerId_providerId: {
          customerId,
          providerId,
        },
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    return this.prisma.favoriteProvider.delete({
      where: {
        customerId_providerId: {
          customerId,
          providerId,
        },
      },
    });
  }

  async getFavorites(customerId: string, pagination: PaginationDto) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      this.prisma.favoriteProvider.findMany({
        where: { customerId },
        include: {
          provider: {
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
      this.prisma.favoriteProvider.count({
        where: { customerId },
      }),
    ]);

    return {
      data: favorites,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Helper: Haversine distance calculation (returns distance in km)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
