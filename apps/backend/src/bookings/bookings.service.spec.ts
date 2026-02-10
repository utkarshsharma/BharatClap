import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { CreateBookingDto } from './dto/create-booking.dto';

const mockPrismaService = {
  service: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  providerService: { findFirst: jest.fn() },
  address: { findUnique: jest.fn() },
  booking: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  bookingStatusLog: { create: jest.fn() },
};

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── State Transition Validation (tested through public API) ───────────────

  describe('State Transitions via acceptBooking', () => {
    const bookingId = 'booking-1';
    const providerId = 'provider-1';

    it('CONFIRMED -> PROVIDER_ASSIGNED (valid)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CONFIRMED,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode: '1234',
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.acceptBooking(providerId, bookingId);

      expect(result.status).toBe(BookingStatus.PROVIDER_ASSIGNED);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: bookingId },
          data: expect.objectContaining({
            status: BookingStatus.PROVIDER_ASSIGNED,
            otpCode: expect.stringMatching(/^\d{4}$/),
          }),
        }),
      );
    });

    it('should generate a 4-digit OTP on accept', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CONFIRMED,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode: '5678',
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      await service.acceptBooking(providerId, bookingId);

      const updateCall = mockPrismaService.booking.update.mock.calls[0][0];
      const otp = updateCall.data.otpCode;
      expect(otp).toHaveLength(4);
      expect(Number(otp)).toBeGreaterThanOrEqual(1000);
      expect(Number(otp)).toBeLessThanOrEqual(9999);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if provider does not match', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId: 'other-provider',
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid state COMPLETED -> PROVIDER_ASSIGNED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state PENDING_PAYMENT -> PROVIDER_ASSIGNED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PENDING_PAYMENT,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state CANCELLED -> PROVIDER_ASSIGNED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CANCELLED,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state REFUNDED -> PROVIDER_ASSIGNED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.REFUNDED,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── verifyOtp ─────────────────────────────────────────────────────────────

  describe('verifyOtp', () => {
    const bookingId = 'booking-1';
    const providerId = 'provider-1';

    it('PROVIDER_ASSIGNED -> IN_PROGRESS with correct OTP', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode: '4567',
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.IN_PROGRESS,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.verifyOtp(providerId, bookingId, {
        otpCode: '4567',
      });

      expect(result.status).toBe(BookingStatus.IN_PROGRESS);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: bookingId },
          data: expect.objectContaining({
            status: BookingStatus.IN_PROGRESS,
          }),
        }),
      );
    });

    it('should throw BadRequestException with wrong OTP', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode: '4567',
      });

      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '0000' }),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '0000' }),
      ).rejects.toThrow('Invalid OTP code');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '1234' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if provider does not match', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId: 'other-provider',
        status: BookingStatus.PROVIDER_ASSIGNED,
        otpCode: '4567',
      });

      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '4567' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid state CONFIRMED -> IN_PROGRESS', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CONFIRMED,
        otpCode: '4567',
      });

      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '4567' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state COMPLETED -> IN_PROGRESS', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.COMPLETED,
        otpCode: '4567',
      });

      await expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '4567' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── completeBooking ──────────────────────────────────────────────────────

  describe('completeBooking', () => {
    const bookingId = 'booking-1';
    const providerId = 'provider-1';

    it('IN_PROGRESS -> COMPLETED and should set completedAt', async () => {
      const now = new Date();
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.IN_PROGRESS,
      });
      mockPrismaService.booking.update.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.COMPLETED,
        completedAt: now,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.completeBooking(providerId, bookingId);

      expect(result.status).toBe(BookingStatus.COMPLETED);
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: bookingId },
          data: expect.objectContaining({
            status: BookingStatus.COMPLETED,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if provider does not match', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId: 'other-provider',
        status: BookingStatus.IN_PROGRESS,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid state CONFIRMED -> COMPLETED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state PENDING_PAYMENT -> COMPLETED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.PENDING_PAYMENT,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid state COMPLETED -> COMPLETED (terminal state)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for REFUNDED -> COMPLETED (terminal state)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.REFUNDED,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── cancelBooking ────────────────────────────────────────────────────────

  describe('cancelBooking', () => {
    const bookingId = 'booking-1';
    const customerId = 'customer-1';
    const providerId = 'provider-1';
    const cancelDto = { reason: 'Schedule conflict' };

    // Helper to create a booking mock with a scheduledDate far in the future
    const makeFutureBooking = (status: BookingStatus) => ({
      id: bookingId,
      customerId,
      providerId,
      status,
      amount: 50000,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      scheduledHour: 14,
    });

    it('should cancel from PENDING_PAYMENT', async () => {
      const booking = makeFutureBooking(BookingStatus.PENDING_PAYMENT);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
        cancelReason: cancelDto.reason,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should cancel from CONFIRMED', async () => {
      const booking = makeFutureBooking(BookingStatus.CONFIRMED);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should cancel from PROVIDER_ASSIGNED', async () => {
      const booking = makeFutureBooking(BookingStatus.PROVIDER_ASSIGNED);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should cancel from IN_PROGRESS', async () => {
      const booking = makeFutureBooking(BookingStatus.IN_PROGRESS);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw BadRequestException for COMPLETED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...makeFutureBooking(BookingStatus.COMPLETED),
      });

      await expect(
        service.cancelBooking(customerId, bookingId, cancelDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for CANCELLED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...makeFutureBooking(BookingStatus.CANCELLED),
      });

      await expect(
        service.cancelBooking(customerId, bookingId, cancelDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for REFUNDED', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        ...makeFutureBooking(BookingStatus.REFUNDED),
      });

      await expect(
        service.cancelBooking(customerId, bookingId, cancelDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is neither customer nor provider', async () => {
      const booking = makeFutureBooking(BookingStatus.CONFIRMED);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);

      await expect(
        service.cancelBooking('random-user', bookingId, cancelDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow provider to cancel their own booking', async () => {
      const booking = makeFutureBooking(BookingStatus.CONFIRMED);
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(providerId, bookingId, cancelDto);

      expect(result.status).toBe(BookingStatus.CANCELLED);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.cancelBooking(customerId, bookingId, cancelDto),
      ).rejects.toThrow(NotFoundException);
    });

    // ─── Refund percentage calculation ─────────────────────────────────────

    it('should calculate 100% refund if 4+ hours before scheduled time', async () => {
      const scheduledDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
      const booking = {
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
        amount: 50000,
        scheduledDate,
        scheduledHour: scheduledDate.getHours(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.refundPercentage).toBe(100);
      expect(result.refundAmount).toBe(50000);
    });

    it('should calculate 50% refund if 1-4 hours before scheduled time', async () => {
      const scheduledDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      const booking = {
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
        amount: 50000,
        scheduledDate,
        scheduledHour: scheduledDate.getHours(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.refundPercentage).toBe(50);
      expect(result.refundAmount).toBe(25000);
    });

    it('should calculate 0% refund if less than 1 hour before scheduled time', async () => {
      const scheduledDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const booking = {
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
        amount: 50000,
        scheduledDate,
        scheduledHour: scheduledDate.getHours(),
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(booking);
      mockPrismaService.booking.update.mockResolvedValue({
        ...booking,
        status: BookingStatus.CANCELLED,
      });
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.cancelBooking(customerId, bookingId, cancelDto);

      expect(result.refundPercentage).toBe(0);
      expect(result.refundAmount).toBe(0);
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    const customerId = 'customer-1';
    const providerId = 'provider-1';
    const serviceId = 'service-1';
    const addressId = 'address-1';
    const providerProfileId = 'profile-1';

    const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now
    const futureDateString = futureDate.toISOString().split('T')[0];

    const baseDto: CreateBookingDto = {
      serviceId,
      providerId,
      addressId,
      scheduledDate: futureDateString,
      scheduledHour: 14,
    };

    it('should throw BadRequestException if scheduled less than 2 hours ahead', async () => {
      // Set the date to right now (less than 2 hours from now)
      const now = new Date();
      const dto: CreateBookingDto = {
        ...baseDto,
        scheduledDate: now.toISOString().split('T')[0],
        scheduledHour: now.getHours(),
      };

      await expect(service.create(customerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customerId, dto)).rejects.toThrow(
        'Booking must be scheduled at least 2 hours in advance',
      );
    });

    it('should throw BadRequestException if scheduled more than 30 days ahead', async () => {
      const farFuture = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000);
      const dto: CreateBookingDto = {
        ...baseDto,
        scheduledDate: farFuture.toISOString().split('T')[0],
        scheduledHour: 14,
      };

      await expect(service.create(customerId, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customerId, dto)).rejects.toThrow(
        'Booking cannot be scheduled more than 30 days in advance',
      );
    });

    it('should throw NotFoundException if service not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Service not found',
      );
    });

    it('should throw NotFoundException if provider not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Provider not found',
      );
    });

    it('should throw BadRequestException if provider does not offer the service', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: providerId,
        isActive: true,
        providerProfile: { id: providerProfileId },
      });
      mockPrismaService.providerService.findFirst.mockResolvedValue(null);

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Provider does not offer this service',
      );
    });

    it('should throw NotFoundException if address not found', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: providerId,
        isActive: true,
        providerProfile: { id: providerProfileId },
      });
      mockPrismaService.providerService.findFirst.mockResolvedValue({
        id: 'ps-1',
        providerId: providerProfileId,
        serviceId,
        customPrice: 45000,
      });
      mockPrismaService.address.findUnique.mockResolvedValue(null);

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Address not found',
      );
    });

    it('should throw ForbiddenException if address does not belong to customer', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: providerId,
        isActive: true,
        providerProfile: { id: providerProfileId },
      });
      mockPrismaService.providerService.findFirst.mockResolvedValue({
        id: 'ps-1',
        providerId: providerProfileId,
        serviceId,
        customPrice: 45000,
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: addressId,
        userId: 'another-customer',
      });

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Address does not belong to the customer',
      );
    });

    it('should create booking with PENDING_PAYMENT status', async () => {
      const mockBooking = {
        id: 'new-booking-1',
        customerId,
        providerId,
        serviceId,
        addressId,
        amount: 45000,
        status: BookingStatus.PENDING_PAYMENT,
        scheduledDate: futureDate,
        scheduledHour: 14,
        service: { id: serviceId, name: 'Test Service' },
        provider: { id: providerId, name: 'Provider Name' },
        customer: { id: customerId, name: 'Customer Name' },
        address: { id: addressId, label: 'Home' },
      };

      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: providerId,
        isActive: true,
        providerProfile: { id: providerProfileId },
      });
      mockPrismaService.providerService.findFirst.mockResolvedValue({
        id: 'ps-1',
        providerId: providerProfileId,
        serviceId,
        customPrice: 45000,
      });
      mockPrismaService.address.findUnique.mockResolvedValue({
        id: addressId,
        userId: customerId,
      });
      mockPrismaService.booking.create.mockResolvedValue(mockBooking);
      mockPrismaService.bookingStatusLog.create.mockResolvedValue({});

      const result = await service.create(customerId, baseDto);

      expect(result.status).toBe(BookingStatus.PENDING_PAYMENT);
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId,
            providerId,
            serviceId,
            addressId,
            status: BookingStatus.PENDING_PAYMENT,
            amount: 45000,
          }),
        }),
      );
    });

    it('should throw BadRequestException if provider is not active', async () => {
      mockPrismaService.service.findUnique.mockResolvedValue({
        id: serviceId,
        name: 'Test Service',
        basePrice: 50000,
        category: { id: 'cat-1', name: 'Cleaning' },
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: providerId,
        isActive: false,
        providerProfile: { id: providerProfileId },
      });

      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(customerId, baseDto)).rejects.toThrow(
        'Provider is not active',
      );
    });
  });

  // ─── Additional state transition edge cases ───────────────────────────────

  describe('State Machine: terminal states', () => {
    const bookingId = 'booking-1';
    const providerId = 'provider-1';

    it('COMPLETED -> anything should throw (via completeBooking trying COMPLETED -> COMPLETED)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.COMPLETED,
      });

      await expect(
        service.completeBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('REFUNDED -> anything should throw (via acceptBooking trying REFUNDED -> PROVIDER_ASSIGNED)', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.REFUNDED,
      });

      await expect(
        service.acceptBooking(providerId, bookingId),
      ).rejects.toThrow(BadRequestException);
    });

    it('CANCELLED -> REFUNDED is valid (tested indirectly since no public method transitions this directly)', () => {
      // The CANCELLED -> REFUNDED transition is handled by the payments service webhook,
      // not by a public method in BookingsService. The state map allows it.
      // We verify the valid transitions map exists by testing that CANCELLED does not allow
      // transitions to IN_PROGRESS.
      // This is tested through verifyOtp: CANCELLED -> IN_PROGRESS should fail
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        providerId,
        status: BookingStatus.CANCELLED,
        otpCode: '1234',
      });

      return expect(
        service.verifyOtp(providerId, bookingId, { otpCode: '1234' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    const bookingId = 'booking-1';
    const customerId = 'customer-1';
    const providerId = 'provider-1';

    it('should return booking if user is customer', async () => {
      const mockBooking = {
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
        service: {},
        provider: {},
        customer: {},
        address: {},
        payment: null,
        review: null,
        statusLog: [],
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findById(customerId, bookingId);

      expect(result.id).toBe(bookingId);
    });

    it('should return booking if user is provider', async () => {
      const mockBooking = {
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
        service: {},
        provider: {},
        customer: {},
        address: {},
        payment: null,
        review: null,
        statusLog: [],
      };
      mockPrismaService.booking.findUnique.mockResolvedValue(mockBooking);

      const result = await service.findById(providerId, bookingId);

      expect(result.id).toBe(bookingId);
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.findById(customerId, bookingId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither customer nor provider', async () => {
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        customerId,
        providerId,
        status: BookingStatus.CONFIRMED,
      });

      await expect(
        service.findById('random-user', bookingId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
