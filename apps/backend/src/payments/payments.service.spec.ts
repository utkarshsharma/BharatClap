import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { PaymentStatus, BookingStatus, PayoutStatus } from '@prisma/client';

const mockPrismaService = {
  payment: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockRazorpayService = {
  createOrder: jest.fn(),
  initiateRefund: jest.fn(),
  verifyPaymentSignature: jest.fn(),
};

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RazorpayService,
          useValue: mockRazorpayService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createPaymentOrder ────────────────────────────────────────────────────

  describe('createPaymentOrder', () => {
    const bookingId = 'booking-1';
    const amount = 50000;

    it('should create order successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        amount,
        status: BookingStatus.PENDING_PAYMENT,
      });
      mockRazorpayService.createOrder.mockResolvedValue({
        id: 'order_razorpay_123',
        amount,
        currency: 'INR',
      });
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        razorpayOrderId: 'order_razorpay_123',
        amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        commission: 0,
        providerPayout: 0,
        payoutStatus: PayoutStatus.PENDING,
      });

      const result = await service.createPaymentOrder(bookingId, amount);

      expect(result.orderId).toBe('order_razorpay_123');
      expect(result.amount).toBe(amount);
      expect(result.currency).toBe('INR');
      expect(result.payment).toBeDefined();
      expect(mockRazorpayService.createOrder).toHaveBeenCalledWith(amount, bookingId);
      expect(mockPrismaService.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookingId,
            razorpayOrderId: 'order_razorpay_123',
            amount,
            status: PaymentStatus.PENDING,
          }),
        }),
      );
    });

    it('should throw ConflictException if payment already exists', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'existing-payment',
        bookingId,
      });

      await expect(
        service.createPaymentOrder(bookingId, amount),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.createPaymentOrder(bookingId, amount),
      ).rejects.toThrow('Payment already exists for this booking');
    });

    it('should throw NotFoundException if booking not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentOrder(bookingId, amount),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.createPaymentOrder(bookingId, amount),
      ).rejects.toThrow('Booking not found');
    });
  });

  // ─── handleWebhook: payment.captured ──────────────────────────────────────

  describe('handleWebhook - payment.captured', () => {
    const signature = 'test-signature';

    const makeCapturedPayload = (orderId: string, paymentId: string, amount: number) => ({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
            amount,
          },
        },
      },
    });

    it('should update payment to CAPTURED and booking to CONFIRMED', async () => {
      const orderId = 'order_123';
      const paymentId = 'pay_456';
      const amount = 50000;
      const body = makeCapturedPayload(orderId, paymentId, amount);

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayOrderId: orderId,
        status: PaymentStatus.PENDING,
        amount,
      });
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            razorpayPaymentId: paymentId,
            status: PaymentStatus.CAPTURED,
          }),
        }),
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.CONFIRMED,
          }),
        }),
      );
    });

    it('should calculate commission as 20% and providerPayout as 80%', async () => {
      const amount = 50000;
      const body = makeCapturedPayload('order_123', 'pay_456', amount);

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayOrderId: 'order_123',
        status: PaymentStatus.PENDING,
        amount,
      });
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      await service.handleWebhook(body, signature);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commission: 10000, // 20% of 50000
            providerPayout: 40000, // 80% of 50000
          }),
        }),
      );
    });

    it('should be idempotent - skip if already CAPTURED', async () => {
      const body = makeCapturedPayload('order_123', 'pay_456', 50000);

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayOrderId: 'order_123',
        status: PaymentStatus.CAPTURED, // Already captured
        amount: 50000,
      });

      await service.handleWebhook(body, signature);

      // Should NOT have updated payment or booking since already captured
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it('should handle missing payment gracefully', async () => {
      const body = makeCapturedPayload('order_nonexistent', 'pay_456', 50000);

      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });
  });

  // ─── handleWebhook: payment.failed ────────────────────────────────────────

  describe('handleWebhook - payment.failed', () => {
    const signature = 'test-signature';

    const makeFailedPayload = (orderId: string, paymentId: string) => ({
      event: 'payment.failed',
      payload: {
        payment: {
          entity: {
            id: paymentId,
            order_id: orderId,
          },
        },
      },
    });

    it('should update payment to FAILED and booking to CANCELLED', async () => {
      const body = makeFailedPayload('order_123', 'pay_456');

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayOrderId: 'order_123',
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            razorpayPaymentId: 'pay_456',
            status: PaymentStatus.FAILED,
          }),
        }),
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.CANCELLED,
          }),
        }),
      );
    });

    it('should be idempotent - skip if already FAILED', async () => {
      const body = makeFailedPayload('order_123', 'pay_456');

      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayOrderId: 'order_123',
        status: PaymentStatus.FAILED, // Already failed
      });

      await service.handleWebhook(body, signature);

      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it('should handle missing payment gracefully', async () => {
      const body = makeFailedPayload('order_nonexistent', 'pay_456');

      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });

  // ─── handleWebhook: refund.processed ──────────────────────────────────────

  describe('handleWebhook - refund.processed', () => {
    const signature = 'test-signature';

    const makeRefundPayload = (paymentId: string, refundId: string, refundAmount: number) => ({
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: refundId,
            payment_id: paymentId,
            amount: refundAmount,
          },
        },
      },
    });

    it('should update payment to REFUNDED with refund details', async () => {
      const body = makeRefundPayload('pay_456', 'rfnd_789', 25000);

      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayPaymentId: 'pay_456',
        status: PaymentStatus.CAPTURED,
        refundId: null,
      });
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundId: 'rfnd_789',
            refundAmount: 25000,
            status: PaymentStatus.REFUNDED,
          }),
        }),
      );
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: BookingStatus.REFUNDED,
          }),
        }),
      );
    });

    it('should be idempotent - skip if already REFUNDED with same refundId', async () => {
      const body = makeRefundPayload('pay_456', 'rfnd_789', 25000);

      mockPrismaService.payment.findFirst.mockResolvedValue({
        id: 'payment-1',
        bookingId: 'booking-1',
        razorpayPaymentId: 'pay_456',
        status: PaymentStatus.REFUNDED,
        refundId: 'rfnd_789', // Already has the same refund ID
      });

      await service.handleWebhook(body, signature);

      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });

    it('should handle missing payment gracefully', async () => {
      const body = makeRefundPayload('pay_nonexistent', 'rfnd_789', 25000);

      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      const result = await service.handleWebhook(body, signature);

      expect(result).toEqual({ received: true });
      expect(mockPrismaService.payment.update).not.toHaveBeenCalled();
    });
  });

  // ─── handleWebhook: unhandled event ───────────────────────────────────────

  describe('handleWebhook - unhandled event', () => {
    it('should return received:true for unhandled events', async () => {
      const body = {
        event: 'payment.authorized',
        payload: {},
      };

      const result = await service.handleWebhook(body, 'sig');

      expect(result).toEqual({ received: true });
    });
  });

  // ─── processRefund ────────────────────────────────────────────────────────

  describe('processRefund', () => {
    const bookingId = 'booking-1';

    it('should throw BadRequestException if refund percentage is invalid (negative)', async () => {
      await expect(
        service.processRefund(bookingId, -10),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processRefund(bookingId, -10),
      ).rejects.toThrow('Refund percentage must be between 0 and 100');
    });

    it('should throw BadRequestException if refund percentage is over 100', async () => {
      await expect(
        service.processRefund(bookingId, 150),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow('Payment not found for this booking');
    });

    it('should throw BadRequestException if payment is not CAPTURED', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        status: PaymentStatus.PENDING,
        amount: 50000,
        razorpayPaymentId: 'pay_456',
      });

      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow('Payment must be in CAPTURED status to process refund');
    });

    it('should throw BadRequestException if razorpayPaymentId not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        status: PaymentStatus.CAPTURED,
        amount: 50000,
        razorpayPaymentId: null,
      });

      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.processRefund(bookingId, 50),
      ).rejects.toThrow('Razorpay payment ID not found');
    });

    it('should calculate refund amount correctly (50% of 50000 = 25000)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        status: PaymentStatus.CAPTURED,
        amount: 50000,
        razorpayPaymentId: 'pay_456',
      });
      mockRazorpayService.initiateRefund.mockResolvedValue({
        id: 'rfnd_new',
        amount: 25000,
      });
      mockPrismaService.payment.update.mockResolvedValue({});

      const result = await service.processRefund(bookingId, 50);

      expect(mockRazorpayService.initiateRefund).toHaveBeenCalledWith('pay_456', 25000);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            refundId: 'rfnd_new',
            refundAmount: 25000,
            status: PaymentStatus.REFUNDED,
          }),
        }),
      );
      expect(result.id).toBe('rfnd_new');
    });

    it('should calculate full refund correctly (100% of 50000 = 50000)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        status: PaymentStatus.CAPTURED,
        amount: 50000,
        razorpayPaymentId: 'pay_456',
      });
      mockRazorpayService.initiateRefund.mockResolvedValue({
        id: 'rfnd_full',
        amount: 50000,
      });
      mockPrismaService.payment.update.mockResolvedValue({});

      await service.processRefund(bookingId, 100);

      expect(mockRazorpayService.initiateRefund).toHaveBeenCalledWith('pay_456', 50000);
    });

    it('should calculate zero refund correctly (0% of 50000 = 0)', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'payment-1',
        bookingId,
        status: PaymentStatus.CAPTURED,
        amount: 50000,
        razorpayPaymentId: 'pay_456',
      });
      mockRazorpayService.initiateRefund.mockResolvedValue({
        id: 'rfnd_zero',
        amount: 0,
      });
      mockPrismaService.payment.update.mockResolvedValue({});

      await service.processRefund(bookingId, 0);

      expect(mockRazorpayService.initiateRefund).toHaveBeenCalledWith('pay_456', 0);
    });
  });

  // ─── getPaymentByBooking ──────────────────────────────────────────────────

  describe('getPaymentByBooking', () => {
    it('should return payment if found', async () => {
      const mockPayment = {
        id: 'payment-1',
        bookingId: 'booking-1',
        amount: 50000,
        booking: {
          id: 'booking-1',
          status: BookingStatus.CONFIRMED,
          amount: 50000,
          customer: { id: 'c1', name: 'Test', email: 'test@test.com' },
          provider: { id: 'p1', name: 'Provider' },
        },
      };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      const result = await service.getPaymentByBooking('booking-1');

      expect(result.id).toBe('payment-1');
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);

      await expect(
        service.getPaymentByBooking('booking-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
