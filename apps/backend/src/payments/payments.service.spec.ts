import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { PayuService } from './payu.service';
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

const mockPayuService = {
  generateCheckoutHtml: jest.fn(),
  generatePaymentHash: jest.fn(),
  verifyPaymentResponse: jest.fn(),
  verifyPaymentAPI: jest.fn(),
  initiateRefund: jest.fn(),
  getMerchantKey: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
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
          provide: PayuService,
          useValue: mockPayuService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
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

    it('should create payment order successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        amount,
        status: BookingStatus.PENDING_PAYMENT,
        customer: { name: 'Test', email: 'test@test.com', phone: '9876543210' },
      });
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        payuTxnId: 'TXN_123',
        amount,
        status: PaymentStatus.PENDING,
      });
      mockPayuService.generateCheckoutHtml.mockReturnValue('<html>checkout</html>');

      const result = await service.createPaymentOrder(bookingId);

      expect(result.html).toBeDefined();
      expect(result.txnid).toBeDefined();
      expect(result.amount).toBe(amount);
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should return existing pending payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        payuTxnId: 'TXN_existing',
        amount,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.booking.findUnique.mockResolvedValue({
        id: bookingId,
        customer: { name: 'Test', email: 'test@test.com', phone: '9876543210' },
      });
      mockPayuService.generateCheckoutHtml.mockReturnValue('<html>checkout</html>');

      const result = await service.createPaymentOrder(bookingId);

      expect(result.txnid).toBe('TXN_existing');
      expect(mockPrismaService.payment.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for captured payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.CAPTURED,
      });

      await expect(service.createPaymentOrder(bookingId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException for missing booking', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue(null);
      mockPrismaService.booking.findUnique.mockResolvedValue(null);

      await expect(service.createPaymentOrder(bookingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ─── verifyPayment ─────────────────────────────────────────────────────────

  describe('verifyPayment', () => {
    const bookingId = 'booking-1';
    const payuResponse = {
      mihpayid: '403993715524373390',
      txnid: 'TXN_123',
      status: 'success',
      hash: 'valid_hash',
      amount: '500.00',
      productinfo: 'BharatClap Service Booking',
      firstname: 'Test',
      email: 'test@test.com',
    };

    it('should verify payment successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        amount: 50000,
        status: PaymentStatus.PENDING,
      });
      mockPayuService.verifyPaymentResponse.mockReturnValue(true);
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      const result = await service.verifyPayment(bookingId, payuResponse);

      expect(result.verified).toBe(true);
      expect(result.status).toBe('captured');
    });

    it('should return already_captured for captured payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.CAPTURED,
      });

      const result = await service.verifyPayment(bookingId, payuResponse);

      expect(result.verified).toBe(true);
      expect(result.status).toBe('already_captured');
    });

    it('should throw for failed payment status', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        amount: 50000,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({});

      await expect(
        service.verifyPayment(bookingId, { ...payuResponse, status: 'failure' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw for invalid hash', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        amount: 50000,
        status: PaymentStatus.PENDING,
      });
      mockPayuService.verifyPaymentResponse.mockReturnValue(false);

      await expect(
        service.verifyPayment(bookingId, payuResponse),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate correct commission split', async () => {
      const amount = 50000; // 500 INR in paise
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        amount,
        status: PaymentStatus.PENDING,
      });
      mockPayuService.verifyPaymentResponse.mockReturnValue(true);
      mockPrismaService.payment.update.mockResolvedValue({});
      mockPrismaService.booking.update.mockResolvedValue({});

      await service.verifyPayment(bookingId, payuResponse);

      expect(mockPrismaService.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commission: 10000, // 20%
            providerPayout: 40000, // 80%
          }),
        }),
      );
    });
  });

  // ─── processRefund ─────────────────────────────────────────────────────────

  describe('processRefund', () => {
    const bookingId = 'booking-1';

    it('should process full refund successfully', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        bookingId,
        amount: 50000,
        status: PaymentStatus.CAPTURED,
        payuMihpayId: 'mihpay_123',
      });
      mockPayuService.initiateRefund.mockResolvedValue({
        id: 'refund_123',
        status: 1,
      });
      mockPrismaService.payment.update.mockResolvedValue({});

      const result = await service.processRefund(bookingId, 100);

      expect(result.id).toBe('refund_123');
      expect(mockPayuService.initiateRefund).toHaveBeenCalledWith(
        'mihpay_123',
        50000,
      );
    });

    it('should throw for non-captured payment', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.PENDING,
      });

      await expect(service.processRefund(bookingId, 100)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw for missing PayU transaction ID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.CAPTURED,
        payuMihpayId: null,
      });

      await expect(service.processRefund(bookingId, 100)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
