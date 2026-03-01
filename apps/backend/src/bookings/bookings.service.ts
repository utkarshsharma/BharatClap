import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PayuService } from '../payments/payu.service';
import { TwilioService } from '../notifications/twilio.service';
import { BookingStatus, UserRole, PaymentStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CancelBookingDto, RejectBookingDto, VerifyOtpDto } from './dto/update-status.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly payuService: PayuService,
    private readonly twilioService: TwilioService,
  ) {}

  /**
   * Create a new booking
   */
  async create(customerId: string, dto: CreateBookingDto) {
    // Validate scheduled date and time
    const scheduledDateTime = new Date(dto.scheduledDate);
    scheduledDateTime.setHours(dto.scheduledHour, 0, 0, 0);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (scheduledDateTime < twoHoursFromNow) {
      throw new BadRequestException(
        'Booking must be scheduled at least 2 hours in advance',
      );
    }

    if (scheduledDateTime > thirtyDaysFromNow) {
      throw new BadRequestException(
        'Booking cannot be scheduled more than 30 days in advance',
      );
    }

    // Validate service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate provider exists and offers the service
    // Accept either User.id or ProviderProfile.id (mobile sends profile ID, web sends user ID)
    let providerUser = await this.prisma.user.findUnique({
      where: { id: dto.providerId },
      include: {
        providerProfile: true,
      },
    });

    if (!providerUser) {
      // Fallback: check if providerId is a ProviderProfile.id and resolve to the User
      const profile = await this.prisma.providerProfile.findUnique({
        where: { id: dto.providerId },
        include: { user: { include: { providerProfile: true } } },
      });
      providerUser = profile?.user ?? null;
    }

    if (!providerUser) {
      throw new NotFoundException('Provider not found');
    }

    if (providerUser.isActive === false) {
      throw new BadRequestException('Provider is not active');
    }

    // Check if provider offers this service
    const providerOffersService = await this.prisma.providerService.findFirst({
      where: {
        providerId: providerUser.providerProfile?.id,
        serviceId: dto.serviceId,
      },
    });

    if (!providerOffersService) {
      throw new BadRequestException('Provider does not offer this service');
    }

    // Validate address belongs to customer
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== customerId) {
      throw new ForbiddenException('Address does not belong to the customer');
    }

    // Validate provider serves this area
    const provider = providerUser.providerProfile;
    if (
      provider?.baseLatitude &&
      provider?.baseLongitude &&
      address.latitude &&
      address.longitude
    ) {
      const distance = this.calculateDistance(
        provider.baseLatitude,
        provider.baseLongitude,
        address.latitude,
        address.longitude,
      );
      if (distance > provider.serviceRadiusKm) {
        throw new BadRequestException(
          `Provider does not serve this area. Provider is ${distance.toFixed(1)}km away, max radius is ${provider.serviceRadiusKm}km`,
        );
      }
    } else {
      // Fallback: city-based check
      if (address.city && providerUser.city) {
        const addressCity = address.city.toLowerCase().trim();
        const providerCity = providerUser.city.toLowerCase().trim();
        if (
          addressCity !== providerCity &&
          !addressCity.includes(providerCity) &&
          !providerCity.includes(addressCity)
        ) {
          throw new BadRequestException(
            `Provider is based in ${providerUser.city} and does not serve ${address.city}`,
          );
        }
      }
    }

    // Get pricing - use custom pricing if available, otherwise use base service price
    let amount = service.basePrice;
    if (providerOffersService) {
      amount = providerOffersService.customPrice;
    }

    // Create booking
    const booking = await this.prisma.booking.create({
      data: {
        customerId,
        providerId: providerUser.id,
        serviceId: dto.serviceId,
        addressId: dto.addressId,
        scheduledDate: scheduledDateTime,
        scheduledHour: dto.scheduledHour,
        amount,
        status: BookingStatus.PENDING_PAYMENT,
        customerNotes: dto.customerNotes,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
      },
      include: {
        service: true,
        provider: true,
        customer: true,
        address: true,
      },
    });

    // Log status change
    await this.logStatusChange(
      booking.id,
      BookingStatus.PENDING_PAYMENT,
      customerId,
      'Booking created',
    );

    return {
      ...booking,
      payuTxnId: null, // Will be created when payment is initiated
      payuOrderInfo: {
        amount: booking.amount,
        currency: 'INR',
        receipt: `booking_${booking.id}`,
      },
    };
  }

  /**
   * Find all bookings for a user
   */
  async findAll(
    userId: string,
    role: UserRole,
    query: BookingQueryDto,
  ): Promise<PaginatedResponseDto<any>> {
    const { page = 1, limit = 20, status, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by role
    if (role === 'CUSTOMER') {
      where.customerId = userId;
    } else if (role === 'PROVIDER') {
      where.providerId = userId;
    }

    // Filter by status (supports comma-separated values)
    if (status) {
      const statuses = status.split(',').map((s) => s.trim());
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }

    // Filter by date range
    if (fromDate || toDate) {
      where.scheduledDate = {};
      if (fromDate) {
        where.scheduledDate.gte = new Date(fromDate);
      }
      if (toDate) {
        const toDateTime = new Date(toDate);
        toDateTime.setHours(23, 59, 59, 999);
        where.scheduledDate.lte = toDateTime;
      }
    }

    const [bookings, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          scheduledDate: 'desc',
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              basePrice: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              avatarUrl: true,
            },
          },
          address: {
            select: {
              id: true,
              label: true,
              addressLine: true,
              city: true,
              pincode: true,
            },
          },
        },
      }),
      this.prisma.booking.count({ where }),
    ]);

    return new PaginatedResponseDto(bookings, total, page, limit);
  }

  /**
   * Find booking by ID
   */
  async findById(userId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        provider: true,
        customer: true,
        address: true,
        payment: true,
        review: true,
        statusLog: {
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check access permission
    if (booking.customerId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('Access denied to this booking');
    }

    return booking;
  }

  /**
   * Provider accepts a booking
   */
  async acceptBooking(providerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.providerId !== providerId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    this.validateStateTransition(booking.status, BookingStatus.PROVIDER_ASSIGNED);

    // Generate OTP
    const otpCode = this.generateOtp();

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode,
      },
      include: {
        service: true,
        customer: true,
        address: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.PROVIDER_ASSIGNED,
      providerId,
      'Provider accepted booking',
    );

    return updatedBooking;
  }

  /**
   * Provider rejects a booking
   */
  async rejectBooking(providerId: string, bookingId: string, dto: RejectBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.providerId !== providerId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    this.validateStateTransition(booking.status, BookingStatus.CANCELLED);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: `Provider rejected: ${dto.reason}`,
      },
      include: {
        service: true,
        customer: true,
        address: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.CANCELLED,
      providerId,
      `Provider rejected: ${dto.reason}`,
    );

    // Trigger full refund since provider rejected
    this.triggerRefund(bookingId, 100).catch((err) => {
      this.logger.error(`Failed to process refund for booking ${bookingId}: ${err.message}`);
    });

    return updatedBooking;
  }

  /**
   * Verify OTP and start booking
   */
  async verifyOtp(providerId: string, bookingId: string, dto: VerifyOtpDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.providerId !== providerId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    this.validateStateTransition(booking.status, BookingStatus.IN_PROGRESS);

    if (booking.otpCode !== dto.otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.IN_PROGRESS,
      },
      include: {
        service: true,
        customer: true,
        address: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.IN_PROGRESS,
      providerId,
      'OTP verified, booking started',
    );

    // Send emergency contact WhatsApp notification
    this.sendEmergencyContactNotification(updatedBooking).catch((err) => {
      this.logger.error(`Failed to send emergency contact notification: ${err.message}`);
    });

    return updatedBooking;
  }

  /**
   * Provider marks booking as complete
   */
  async completeBooking(providerId: string, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.providerId !== providerId) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    this.validateStateTransition(booking.status, BookingStatus.COMPLETED);

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        service: true,
        customer: true,
        address: true,
        payment: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.COMPLETED,
      providerId,
      'Booking completed',
    );

    // Credit 80% payout to provider
    this.processProviderPayout(updatedBooking).catch((err) => {
      this.logger.error(`Failed to process provider payout for booking ${bookingId}: ${err.message}`);
    });

    return updatedBooking;
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(userId: string, bookingId: string, dto: CancelBookingDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check if user has permission to cancel
    if (booking.customerId !== userId && booking.providerId !== userId) {
      throw new ForbiddenException('You do not have permission to cancel this booking');
    }

    // Cannot cancel completed or already cancelled bookings
    if (([BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED] as BookingStatus[]).includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking with status: ${booking.status}`);
    }

    // Calculate refund percentage
    const refundPercentage = this.calculateRefundPercentage(
      booking.scheduledDate,
      booking.scheduledHour,
    );

    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelReason: dto.reason,
      },
      include: {
        service: true,
        customer: true,
        provider: true,
        address: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.CANCELLED,
      userId,
      `Cancelled: ${dto.reason} | Refund: ${refundPercentage}%`,
    );

    // Trigger refund based on cancellation policy
    if (refundPercentage > 0) {
      this.triggerRefund(bookingId, refundPercentage).catch((err) => {
        this.logger.error(`Failed to process refund for booking ${bookingId}: ${err.message}`);
      });
    }

    return {
      ...updatedBooking,
      refundPercentage,
      refundAmount: Math.floor((booking.amount * refundPercentage) / 100),
    };
  }

  /**
   * Rebook a previous booking
   */
  async rebookBooking(customerId: string, bookingId: string) {
    const originalBooking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!originalBooking) {
      throw new NotFoundException('Booking not found');
    }

    if (originalBooking.customerId !== customerId) {
      throw new ForbiddenException('You do not have permission to rebook this booking');
    }

    // Create a new booking with same details but updated schedule
    const dto: CreateBookingDto = {
      serviceId: originalBooking.serviceId,
      providerId: originalBooking.providerId!,
      addressId: originalBooking.addressId,
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      scheduledHour: originalBooking.scheduledHour,
      customerNotes: originalBooking.customerNotes || undefined,
      emergencyContactName: originalBooking.emergencyContactName || undefined,
      emergencyContactPhone: originalBooking.emergencyContactPhone || undefined,
    };

    return this.create(customerId, dto);
  }

  /**
   * Dev-mode: confirm booking with mock payment (bypasses PayU)
   */
  async devConfirm(bookingId: string) {
    const nodeEnv = this.configService.get<string>('app.nodeEnv') || process.env.NODE_ENV;
    if (nodeEnv !== 'development') {
      throw new ForbiddenException('Dev confirm is only available in development mode');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Cannot dev-confirm a booking with status: ${booking.status}`,
      );
    }

    // Create mock payment
    await this.prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.amount,
        currency: 'INR',
        status: PaymentStatus.CAPTURED,
        payuTxnId: `dev_txn_${Date.now()}`,
        payuMihpayId: `dev_mihpay_${Date.now()}`,
      },
    });

    // Move booking to CONFIRMED
    const updatedBooking = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
      include: {
        service: true,
        provider: true,
        customer: true,
        address: true,
        payment: true,
      },
    });

    await this.logStatusChange(
      bookingId,
      BookingStatus.CONFIRMED,
      booking.customerId,
      'Dev-mode payment confirmed',
    );

    return updatedBooking;
  }

  /**
   * Send WhatsApp notification to emergency contact when booking starts
   */
  private async sendEmergencyContactNotification(booking: any) {
    if (!booking.emergencyContactPhone) {
      return;
    }

    const customerName = booking.customer?.name || 'A customer';
    const providerName = booking.provider?.name || 'a service provider';
    const serviceName = booking.service?.name || 'a home service';
    const address = booking.address
      ? `${booking.address.addressLine}, ${booking.address.city}`
      : 'their address';

    const message =
      `${customerName} has a home service at ${address} ` +
      `with provider ${providerName} (Aadhaar verified). ` +
      `Service: ${serviceName}. ` +
      `This is an automated safety notification from BharatClap.`;

    const phone = booking.emergencyContactPhone.startsWith('+')
      ? booking.emergencyContactPhone
      : `+91${booking.emergencyContactPhone}`;

    await this.twilioService.sendWhatsApp(phone, message);

    this.logger.log(
      `Emergency contact notification sent for booking ${booking.id}`,
    );
  }

  /**
   * Trigger refund for a cancelled booking
   */
  private async triggerRefund(bookingId: string, refundPercentage: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment || payment.status !== PaymentStatus.CAPTURED || !payment.payuMihpayId) {
      this.logger.warn(`Cannot refund booking ${bookingId}: no captured payment`);
      return;
    }

    const refundAmount = Math.floor(payment.amount * (refundPercentage / 100));

    try {
      const refund = await this.payuService.initiateRefund(
        payment.payuMihpayId,
        refundAmount,
      );

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundId: refund.id,
          refundAmount,
          status: PaymentStatus.REFUNDED,
        },
      });

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.REFUNDED },
      });

      this.logger.log(`Refund of ${refundAmount} processed for booking ${bookingId}`);
    } catch (err: any) {
      this.logger.error(`Refund failed for booking ${bookingId}: ${err.message}`);
    }
  }

  /**
   * Process provider payout after booking completion.
   * Credits 80% of payment to provider's wallet balance.
   */
  private async processProviderPayout(booking: any) {
    if (!booking.payment || booking.payment.status !== PaymentStatus.CAPTURED) {
      this.logger.warn(`No captured payment for booking ${booking.id}, skipping payout`);
      return;
    }

    const payment = booking.payment;
    const providerPayout = payment.providerPayout || Math.floor(payment.amount * 0.8);

    // Update payment payout status
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { payoutStatus: 'COMPLETED' as any },
    });

    // Credit provider wallet balance
    await this.prisma.providerProfile.update({
      where: { userId: booking.providerId },
      data: {
        walletBalance: { increment: providerPayout },
        totalEarnings: { increment: providerPayout },
        totalJobs: { increment: 1 },
      },
    });

    this.logger.log(
      `Provider payout of ${providerPayout} credited for booking ${booking.id}`,
    );
  }

  /**
   * Log status change
   */
  private async logStatusChange(
    bookingId: string,
    status: BookingStatus,
    changedBy: string,
    notes?: string,
  ) {
    await this.prisma.bookingStatusLog.create({
      data: {
        bookingId,
        status,
        changedBy,
        notes,
      },
    });
  }

  /**
   * Generate a 4-digit OTP
   */
  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  /**
   * Calculate refund percentage based on cancellation policy
   */
  private calculateRefundPercentage(scheduledDate: Date, scheduledHour: number): number {
    const scheduledDateTime = new Date(scheduledDate);
    scheduledDateTime.setHours(scheduledHour, 0, 0, 0);

    const now = new Date();
    const hoursUntilBooking = (scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking >= 4) {
      return 100; // 100% refund if cancelled 4+ hours before
    } else if (hoursUntilBooking >= 1) {
      return 50; // 50% refund if cancelled 1-4 hours before
    } else {
      return 0; // No refund if cancelled less than 1 hour before
    }
  }

  /**
   * Validate state transition
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private validateStateTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING_PAYMENT]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
      [BookingStatus.CONFIRMED]: [BookingStatus.PROVIDER_ASSIGNED, BookingStatus.CANCELLED],
      [BookingStatus.PROVIDER_ASSIGNED]: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
      [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [BookingStatus.REFUNDED],
      [BookingStatus.REFUNDED]: [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }
}
