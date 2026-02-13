import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DisputesService } from '../disputes/disputes.service';
import { OverrideDisputeDto } from '../disputes/dto/override-dispute.dto';
import {
  AdminBookingQueryDto,
  AdminProviderQueryDto,
} from './dto/admin-query.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { BookingStatus, PaymentStatus, KycStatus, Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly disputesService: DisputesService,
  ) {}

  async getDashboard() {
    // Calculate date for 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalBookings,
      capturedPayments,
      activeProviders,
      activeCustomers,
      pendingKycCount,
      bookingsThisWeek,
      paymentsThisWeek,
    ] = await Promise.all([
      // Total bookings count
      this.prisma.booking.count(),

      // Total revenue (sum of commission from captured payments)
      this.prisma.payment.aggregate({
        where: { status: PaymentStatus.CAPTURED },
        _sum: { commission: true },
      }),

      // Active providers with at least 1 service
      this.prisma.user.count({
        where: {
          role: 'PROVIDER',
          isActive: true,
          providerProfile: {
            isNot: null,
          },
        },
      }),

      // Active customers (users who made at least 1 booking)
      this.prisma.user.count({
        where: {
          role: 'CUSTOMER',
          isActive: true,
          bookingsAsCustomer: {
            some: {},
          },
        },
      }),

      // Pending KYC count
      this.prisma.providerProfile.count({
        where: {
          kycStatus: KycStatus.PENDING,
        },
      }),

      // Bookings this week
      this.prisma.booking.count({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
      }),

      // Revenue this week
      this.prisma.payment.aggregate({
        where: {
          status: PaymentStatus.CAPTURED,
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _sum: { commission: true },
      }),
    ]);

    const totalRevenue = capturedPayments._sum?.commission || 0;
    const revenueThisWeek = paymentsThisWeek._sum?.commission || 0;

    return {
      totalBookings,
      totalRevenue,
      activeProviders,
      activeCustomers,
      pendingKycCount,
      bookingsThisWeek,
      revenueThisWeek,
    };
  }

  async getBookings(query: AdminBookingQueryDto) {
    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    // Build where clause
    const where: Prisma.BookingWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.city) {
      where.address = {
        city: {
          contains: query.city,
          mode: 'insensitive',
        },
      };
    }

    if (query.fromDate || query.toDate) {
      where.scheduledDate = {};
      if (query.fromDate) {
        where.scheduledDate.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.scheduledDate.lte = new Date(query.toDate);
      }
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          payment: true,
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async getProviders(query: AdminProviderQueryDto) {
    const skip = ((query.page || 1) - 1) * (query.limit || 20);
    const take = query.limit || 20;

    // Build where clause
    const where: Prisma.UserWhereInput = {
      role: 'PROVIDER',
      providerProfile: {
        isNot: null,
      },
    };

    // Add KYC status filter
    if (query.kycStatus) {
      where.providerProfile = {
        ...where.providerProfile as object,
        kycStatus: query.kycStatus,
      };
    }

    // Note: City filter not implemented as ProviderProfile doesn't have a city field
    // City information would need to be derived from user's addresses or service areas

    // Add rating filter
    if (query.minRating !== undefined || query.maxRating !== undefined) {
      const ratingWhere: any = {};
      if (query.minRating !== undefined) {
        ratingWhere.gte = query.minRating;
      }
      if (query.maxRating !== undefined) {
        ratingWhere.lte = query.maxRating;
      }
      where.providerProfile = {
        ...where.providerProfile,
        avgRating: ratingWhere,
      };
    }

    const [providers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          providerProfile: {
            include: {
              providerServices: {
                include: {
                  service: true,
                },
              },
            },
          },
          bookingsAsProvider: {
            where: { status: BookingStatus.COMPLETED },
            select: { id: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Transform data to include computed fields
    const transformedProviders = providers.map((provider) => ({
      ...provider,
      totalJobs: provider.bookingsAsProvider.length,
      rating: provider.providerProfile?.avgRating || 0,
      kycStatus: provider.providerProfile?.kycStatus || KycStatus.PENDING,
    }));

    return {
      data: transformedProviders,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    };
  }

  async getProviderDetail(providerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: providerId },
      include: {
        providerProfile: {
          include: {
            providerServices: {
              include: { service: { include: { category: true } } },
            },
            portfolioItems: true,
            availability: true,
          },
        },
        bookingsAsProvider: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            service: true,
            customer: { select: { id: true, name: true, phone: true } },
            payment: true,
          },
        },
        reviewsReceived: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!user || user.role !== 'PROVIDER') {
      throw new NotFoundException('Provider not found');
    }

    const completedBookings = await this.prisma.booking.count({
      where: { providerId: providerId, status: BookingStatus.COMPLETED },
    });

    const totalEarnings = await this.prisma.payment.aggregate({
      where: {
        booking: { providerId: providerId, status: BookingStatus.COMPLETED },
        status: PaymentStatus.CAPTURED,
      },
      _sum: { providerPayout: true },
    });

    return {
      ...user,
      completedBookings,
      totalEarnings: totalEarnings._sum?.providerPayout || 0,
    };
  }

  async approveProvider(providerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: providerId },
      include: { providerProfile: true },
    });

    if (!user || user.role !== 'PROVIDER') {
      throw new NotFoundException('Provider not found');
    }

    if (!user.providerProfile) {
      throw new BadRequestException('Provider profile not found');
    }

    const updatedProfile = await this.prisma.providerProfile.update({
      where: { userId: providerId },
      data: {
        kycStatus: KycStatus.VERIFIED,
        aadhaarVerified: true,
      },
    });

    return {
      success: true,
      message: 'Provider approved successfully',
      profile: updatedProfile,
    };
  }

  async suspendProvider(providerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: providerId },
    });

    if (!user || user.role !== 'PROVIDER') {
      throw new NotFoundException('Provider not found');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: providerId },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Provider suspended successfully',
      user: updatedUser,
    };
  }

  async getPaymentsOverview() {
    const [totalRevenue, totalCommission, pendingPayouts, completedPayouts] =
      await Promise.all([
        // Total revenue from captured payments
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.CAPTURED },
          _sum: { amount: true },
        }),

        // Total commission
        this.prisma.payment.aggregate({
          where: { status: PaymentStatus.CAPTURED },
          _sum: { commission: true },
        }),

        // Pending payouts sum
        this.prisma.payment.aggregate({
          where: {
            status: PaymentStatus.CAPTURED,
            payoutStatus: 'PENDING',
          },
          _sum: { providerPayout: true },
        }),

        // Completed payouts sum
        this.prisma.payment.aggregate({
          where: {
            payoutStatus: 'COMPLETED',
          },
          _sum: { providerPayout: true },
        }),
      ]);

    return {
      totalRevenue: totalRevenue._sum?.amount || 0,
      totalCommission: totalCommission._sum?.commission || 0,
      pendingPayouts: pendingPayouts._sum?.providerPayout || 0,
      completedPayouts: completedPayouts._sum?.providerPayout || 0,
    };
  }

  async triggerBatchPayout() {
    // Find all payments that need payout
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        payoutStatus: 'PENDING',
        booking: {
          status: BookingStatus.COMPLETED,
        },
      },
      include: {
        booking: true,
      },
    });

    if (payments.length === 0) {
      return {
        success: true,
        message: 'No pending payouts to process',
        count: 0,
      };
    }

    // Mark all payments as PROCESSING
    const paymentIds = payments.map((p) => p.id);
    await this.prisma.payment.updateMany({
      where: {
        id: { in: paymentIds },
      },
      data: {
        payoutStatus: 'PROCESSING',
      },
    });

    // TODO: Actual Razorpay transfer implementation
    // This would involve calling Razorpay's transfer API

    return {
      success: true,
      message: `Batch payout triggered for ${payments.length} payments`,
      count: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.providerPayout, 0),
    };
  }

  async getDisputes(pagination: PaginationDto) {
    return this.disputesService.listDisputes({
      page: pagination.page || 1,
      limit: pagination.limit || 20,
    });
  }

  async overrideDispute(disputeId: string, dto: OverrideDisputeDto) {
    return this.disputesService.adminOverride(disputeId, dto);
  }
}
