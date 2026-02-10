import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecurringFreq, BookingStatus } from '@prisma/client';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';

@Injectable()
export class RecurringService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new recurring booking
   */
  async create(customerId: string, dto: CreateRecurringDto) {
    // Validate service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Validate provider exists
    const providerUser = await this.prisma.user.findUnique({
      where: { id: dto.providerId },
    });

    if (!providerUser) {
      throw new NotFoundException('Provider not found');
    }

    if (providerUser.isActive === false) {
      throw new BadRequestException('Provider is not active');
    }

    // Check if provider offers this service
    const providerOffersService = await this.prisma.providerService.findFirst({
      where: {
        providerId: dto.providerId,
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

    // Calculate next booking date
    const nextBookingDate = this.calculateNextDate(dto.frequency, dto.dayOfWeek);

    // Create recurring booking
    const recurringBooking = await this.prisma.recurringBooking.create({
      data: {
        customerId,
        providerId: dto.providerId,
        serviceId: dto.serviceId,
        addressId: dto.addressId,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        preferredHour: dto.preferredHour,
        isActive: true,
        nextBookingDate,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        provider: true,
        customer: true,
        address: true,
      },
    });

    return recurringBooking;
  }

  /**
   * Find all recurring bookings for a user
   */
  async findAll(userId: string) {
    const recurringBookings = await this.prisma.recurringBooking.findMany({
      where: {
        customerId: userId,
      },
      orderBy: {
        nextBookingDate: 'asc',
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        provider: true,
        address: {
          select: {
            id: true,
            label: true,
            addressLine: true,
            city: true,
            pincode: true,
          },
        },
        bookings: {
          select: {
            id: true,
            scheduledDate: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            scheduledDate: 'desc',
          },
          take: 5,
        },
      },
    });

    return recurringBookings;
  }

  /**
   * Find a recurring booking by ID
   */
  async findById(userId: string, recurringId: string) {
    const recurringBooking = await this.prisma.recurringBooking.findUnique({
      where: { id: recurringId },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        provider: true,
        customer: true,
        address: true,
        bookings: {
          orderBy: {
            scheduledDate: 'desc',
          },
          include: {
            service: true,
            provider: true,
          },
        },
      },
    });

    if (!recurringBooking) {
      throw new NotFoundException('Recurring booking not found');
    }

    if (recurringBooking.customerId !== userId) {
      throw new ForbiddenException('Access denied to this recurring booking');
    }

    return recurringBooking;
  }

  /**
   * Update a recurring booking
   */
  async update(userId: string, recurringId: string, dto: UpdateRecurringDto) {
    const recurringBooking = await this.prisma.recurringBooking.findUnique({
      where: { id: recurringId },
    });

    if (!recurringBooking) {
      throw new NotFoundException('Recurring booking not found');
    }

    if (recurringBooking.customerId !== userId) {
      throw new ForbiddenException('Access denied to this recurring booking');
    }

    if (!recurringBooking.isActive) {
      throw new BadRequestException('Cannot update inactive recurring booking');
    }

    // Calculate new next booking date if frequency or day of week changed
    let nextBookingDate: Date | null = recurringBooking.nextBookingDate;
    if (dto.frequency || dto.dayOfWeek !== undefined) {
      const frequency = dto.frequency || recurringBooking.frequency;
      const dayOfWeek = dto.dayOfWeek !== undefined ? dto.dayOfWeek : recurringBooking.dayOfWeek;
      nextBookingDate = this.calculateNextDate(frequency, dayOfWeek);
    }

    const updatedRecurring = await this.prisma.recurringBooking.update({
      where: { id: recurringId },
      data: {
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        preferredHour: dto.preferredHour,
        nextBookingDate,
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        provider: true,
        address: true,
      },
    });

    return updatedRecurring;
  }

  /**
   * Cancel (deactivate) a recurring booking
   */
  async cancel(userId: string, recurringId: string) {
    const recurringBooking = await this.prisma.recurringBooking.findUnique({
      where: { id: recurringId },
    });

    if (!recurringBooking) {
      throw new NotFoundException('Recurring booking not found');
    }

    if (recurringBooking.customerId !== userId) {
      throw new ForbiddenException('Access denied to this recurring booking');
    }

    const updatedRecurring = await this.prisma.recurringBooking.update({
      where: { id: recurringId },
      data: {
        isActive: false,
      },
      include: {
        service: true,
        provider: true,
        address: true,
      },
    });

    return updatedRecurring;
  }

  /**
   * Confirm next occurrence - create a real booking
   */
  async confirmNext(userId: string, recurringId: string) {
    const recurringBooking = await this.prisma.recurringBooking.findUnique({
      where: { id: recurringId },
      include: {
        service: true,
      },
    });

    if (!recurringBooking) {
      throw new NotFoundException('Recurring booking not found');
    }

    if (recurringBooking.customerId !== userId) {
      throw new ForbiddenException('Access denied to this recurring booking');
    }

    if (!recurringBooking.isActive) {
      throw new BadRequestException('Cannot confirm inactive recurring booking');
    }

    if (!recurringBooking.nextBookingDate) {
      throw new BadRequestException('No next booking date set');
    }

    // Check if next booking date is valid (at least 2 hours from now)
    const scheduledDateTime = new Date(recurringBooking.nextBookingDate);
    scheduledDateTime.setHours(recurringBooking.preferredHour, 0, 0, 0);

    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    if (scheduledDateTime < twoHoursFromNow) {
      throw new BadRequestException(
        'Next booking date is too soon. Please update the recurring schedule.',
      );
    }

    // Get pricing
    let amount = recurringBooking.service.basePrice;
    const customPricing = await this.prisma.providerService.findFirst({
      where: {
        providerId: recurringBooking.providerId,
        serviceId: recurringBooking.serviceId,
      },
    });
    if (customPricing) {
      amount = customPricing.customPrice;
    }

    // Create the booking
    const booking = await this.prisma.booking.create({
      data: {
        customerId: recurringBooking.customerId,
        providerId: recurringBooking.providerId,
        serviceId: recurringBooking.serviceId,
        addressId: recurringBooking.addressId,
        scheduledDate: recurringBooking.nextBookingDate,
        scheduledHour: recurringBooking.preferredHour,
        amount,
        status: BookingStatus.PENDING_PAYMENT,
        recurringBookingId: recurringBooking.id,
      },
      include: {
        service: true,
        provider: true,
        customer: true,
        address: true,
      },
    });

    // Log the booking status
    await this.prisma.bookingStatusLog.create({
      data: {
        bookingId: booking.id,
        status: BookingStatus.PENDING_PAYMENT,
        changedBy: userId,
        notes: 'Created from recurring booking',
      },
    });

    // Update next booking date
    const newNextBookingDate = this.calculateNextDate(
      recurringBooking.frequency,
      recurringBooking.dayOfWeek,
      recurringBooking.nextBookingDate ?? undefined,
    );

    await this.prisma.recurringBooking.update({
      where: { id: recurringId },
      data: {
        nextBookingDate: newNextBookingDate,
      },
    });

    return {
      booking,
      nextBookingDate: newNextBookingDate,
    };
  }

  /**
   * Skip next occurrence
   */
  async skipNext(userId: string, recurringId: string) {
    const recurringBooking = await this.prisma.recurringBooking.findUnique({
      where: { id: recurringId },
    });

    if (!recurringBooking) {
      throw new NotFoundException('Recurring booking not found');
    }

    if (recurringBooking.customerId !== userId) {
      throw new ForbiddenException('Access denied to this recurring booking');
    }

    if (!recurringBooking.isActive) {
      throw new BadRequestException('Cannot skip inactive recurring booking');
    }

    // Calculate the next occurrence after the current next booking date
    const newNextBookingDate = this.calculateNextDate(
      recurringBooking.frequency,
      recurringBooking.dayOfWeek,
      recurringBooking.nextBookingDate ?? undefined,
    );

    const updatedRecurring = await this.prisma.recurringBooking.update({
      where: { id: recurringId },
      data: {
        nextBookingDate: newNextBookingDate,
      },
      include: {
        service: true,
        provider: true,
        address: true,
      },
    });

    return updatedRecurring;
  }

  /**
   * Calculate next occurrence date based on frequency and day of week
   */
  private calculateNextDate(
    frequency: RecurringFreq,
    dayOfWeek: number,
    fromDate?: Date,
  ): Date {
    const startDate = fromDate ? new Date(fromDate) : new Date();
    let nextDate = new Date(startDate);

    // Move to next day to avoid returning the same date
    nextDate.setDate(nextDate.getDate() + 1);

    switch (frequency) {
      case RecurringFreq.WEEKLY:
        // Find next occurrence of the specified day of week
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;

      case RecurringFreq.BIWEEKLY: {
        // Find next occurrence of the specified day of week, at least 14 days from start
        const twoWeeksLater = new Date(startDate);
        twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
        nextDate = new Date(twoWeeksLater);
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      }

      case RecurringFreq.MONTHLY: {
        // Find next occurrence of the specified day of week in the next month
        const nextMonth = new Date(startDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        nextDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
        while (nextDate.getDay() !== dayOfWeek) {
          nextDate.setDate(nextDate.getDate() + 1);
        }
        break;
      }
    }

    // Reset time to start of day
    nextDate.setHours(0, 0, 0, 0);

    return nextDate;
  }
}
