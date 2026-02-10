import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RazorpayService } from './razorpay.service';
import { PaymentStatus, PayoutStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private razorpayService: RazorpayService,
  ) {}

  async createPaymentOrder(bookingId: string, amount: number) {
    // Check if payment already exists for this booking
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      throw new ConflictException('Payment already exists for this booking');
    }

    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Create Razorpay order
    const order = await this.razorpayService.createOrder(amount, bookingId);

    // Save payment record with PENDING status
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        razorpayOrderId: order.id,
        amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        commission: 0,
        providerPayout: 0,
        payoutStatus: PayoutStatus.PENDING,
      },
    });

    this.logger.log(`Created payment order for booking: ${bookingId}`);

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      payment,
    };
  }

  async handleWebhook(body: any, signature: string) {
    this.logger.log(`Received webhook event: ${body.event}`);

    const event = body.event;
    const payload = body.payload;

    switch (event) {
      case 'payment.captured':
        await this.handlePaymentCaptured(payload);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(payload);
        break;
      case 'refund.processed':
        await this.handleRefundProcessed(payload);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event}`);
    }

    return { received: true };
  }

  private async handlePaymentCaptured(payload: any) {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;
    const amount = paymentEntity.amount;

    // Find payment by Razorpay order ID
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      this.logger.error(`Payment not found for order: ${orderId}`);
      return;
    }

    // Idempotent check: if already captured, skip
    if (payment.status === PaymentStatus.CAPTURED) {
      this.logger.log(`Payment already captured: ${payment.id}`);
      return;
    }

    // Calculate commission (20%) and provider payout (80%)
    const commission = Math.floor(amount * 0.2);
    const providerPayout = amount - commission;

    // Update payment status to CAPTURED
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        status: PaymentStatus.CAPTURED,
        commission,
        providerPayout,
      },
    });

    // Update booking status to CONFIRMED
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
      },
    });

    this.logger.log(`Payment captured for booking: ${payment.bookingId}`);
  }

  private async handlePaymentFailed(payload: any) {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    // Find payment by Razorpay order ID
    const payment = await this.prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) {
      this.logger.error(`Payment not found for order: ${orderId}`);
      return;
    }

    // Idempotent check
    if (payment.status === PaymentStatus.FAILED) {
      this.logger.log(`Payment already marked as failed: ${payment.id}`);
      return;
    }

    // Update payment status to FAILED
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        status: PaymentStatus.FAILED,
      },
    });

    // Optionally update booking status to CANCELLED
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.CANCELLED,
      },
    });

    this.logger.log(`Payment failed for booking: ${payment.bookingId}`);
  }

  private async handleRefundProcessed(payload: any) {
    const refundEntity = payload.refund.entity;
    const paymentId = refundEntity.payment_id;
    const refundId = refundEntity.id;
    const refundAmount = refundEntity.amount;

    // Find payment by Razorpay payment ID
    const payment = await this.prisma.payment.findFirst({
      where: { razorpayPaymentId: paymentId },
    });

    if (!payment) {
      this.logger.error(`Payment not found for payment ID: ${paymentId}`);
      return;
    }

    // Idempotent check
    if (payment.status === PaymentStatus.REFUNDED && payment.refundId === refundId) {
      this.logger.log(`Refund already processed: ${payment.id}`);
      return;
    }

    // Update payment with refund details
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundId,
        refundAmount,
        status: PaymentStatus.REFUNDED,
      },
    });

    // Update booking status to REFUNDED
    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: {
        status: BookingStatus.REFUNDED,
      },
    });

    this.logger.log(`Refund processed for booking: ${payment.bookingId}`);
  }

  async getPaymentByBooking(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            amount: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    return payment;
  }

  async processRefund(bookingId: string, refundPercentage: number) {
    if (refundPercentage < 0 || refundPercentage > 100) {
      throw new BadRequestException('Refund percentage must be between 0 and 100');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    if (payment.status !== PaymentStatus.CAPTURED) {
      throw new BadRequestException('Payment must be in CAPTURED status to process refund');
    }

    if (!payment.razorpayPaymentId) {
      throw new BadRequestException('Razorpay payment ID not found');
    }

    // Calculate refund amount
    const refundAmount = Math.floor(payment.amount * (refundPercentage / 100));

    // Initiate refund via Razorpay
    const refund = await this.razorpayService.initiateRefund(
      payment.razorpayPaymentId,
      refundAmount,
    );

    // Update payment with refund details
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        refundId: refund.id,
        refundAmount,
        status: PaymentStatus.REFUNDED,
      },
    });

    this.logger.log(`Initiated refund for booking: ${bookingId}`);

    return refund;
  }
}
