import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PayuService } from './payu.service';
import { PaymentStatus, PayoutStatus, BookingStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private payuService: PayuService,
    private configService: ConfigService,
  ) {}

  /**
   * Create a PayU payment initiation for a booking.
   * Returns HTML form + txnid for the mobile WebView.
   */
  async createPaymentOrder(bookingId: string, amountOverride?: number, callbackBaseUrl?: string) {
    // Derive the callback URL for PayU surl/furl
    // The mobile app passes its API base URL so the WebView can reach it
    const callbackUrl = callbackBaseUrl
      ? `${callbackBaseUrl.replace(/\/api\/v1\/?$/, '')}/api/v1/payments/payu/callback`
      : `http://localhost:3000/api/v1/payments/payu/callback`;

    // Check if payment already exists for this booking
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment) {
      if (existingPayment.status === PaymentStatus.PENDING) {
        // Re-generate checkout HTML for existing pending payment
        const booking = await this.prisma.booking.findUnique({
          where: { id: bookingId },
          include: { customer: { select: { name: true, email: true, phone: true } } },
        });

        const amountInRupees = (existingPayment.amount / 100).toFixed(2);

        const html = this.payuService.generateCheckoutHtml({
          txnid: existingPayment.payuTxnId!,
          amount: amountInRupees,
          productinfo: 'BharatClap Service Booking',
          firstname: booking?.customer?.name || 'Customer',
          email: booking?.customer?.email || 'customer@bharatclap.com',
          phone: booking?.customer?.phone || '',
          surl: callbackUrl,
          furl: callbackUrl,
          udf1: bookingId,
        });

        return {
          html,
          txnid: existingPayment.payuTxnId,
          amount: existingPayment.amount,
        };
      }
      throw new ConflictException('Payment already exists for this booking');
    }

    // Verify booking exists
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { select: { name: true, email: true, phone: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        `Cannot create payment for booking with status: ${booking.status}`,
      );
    }

    const amount = amountOverride ?? booking.amount;
    const txnid = `TXN_${Date.now()}_${bookingId.slice(0, 8)}`;
    const amountInRupees = (amount / 100).toFixed(2);

    // Save payment record with PENDING status
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        payuTxnId: txnid,
        amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        commission: 0,
        providerPayout: 0,
        payoutStatus: PayoutStatus.PENDING,
      },
    });

    const html = this.payuService.generateCheckoutHtml({
      txnid,
      amount: amountInRupees,
      productinfo: 'BharatClap Service Booking',
      firstname: booking.customer?.name || 'Customer',
      email: booking.customer?.email || 'customer@bharatclap.com',
      phone: booking.customer?.phone || '',
      surl: callbackUrl,
      furl: callbackUrl,
      udf1: bookingId,
    });

    this.logger.log(`Created PayU payment for booking: ${bookingId}, txnid: ${txnid}, callback: ${callbackUrl}`);

    return {
      html,
      txnid,
      amount,
      payment,
    };
  }

  /**
   * Test mode: make payment entirely server-side via PayU S2S API.
   * Skips the WebView — the backend calls PayU directly with test VPA,
   * PayU auto-succeeds, and booking is confirmed immediately.
   */
  async autoPayTestMode(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { customer: { select: { name: true, email: true, phone: true } } },
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new BadRequestException(`Cannot pay for booking with status: ${booking.status}`);
    }

    const txnid = `TXN_${Date.now()}_${bookingId.slice(0, 8)}`;
    const amountInRupees = (booking.amount / 100).toFixed(2);

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        bookingId,
        payuTxnId: txnid,
        amount: booking.amount,
        currency: 'INR',
        status: PaymentStatus.PENDING,
        commission: 0,
        providerPayout: 0,
        payoutStatus: PayoutStatus.PENDING,
      },
    });

    // Call PayU S2S API with test VPA
    const payuResult = await this.payuService.makeS2SPayment({
      txnid,
      amount: amountInRupees,
      productinfo: 'BharatClap Service Booking',
      firstname: booking.customer?.name || 'Customer',
      email: booking.customer?.email || 'customer@bharatclap.com',
      phone: booking.customer?.phone || '9999999999',
      surl: 'https://bharatclap.app/success',
      furl: 'https://bharatclap.app/failure',
      udf1: bookingId,
    });

    // Check if PayU accepted the payment
    const mihpayid = payuResult?.mihpayid;
    const status = payuResult?.status;

    if (status === 'success' || mihpayid) {
      const commission = Math.floor(booking.amount * 0.2);
      const providerPayout = booking.amount - commission;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          payuMihpayId: mihpayid || `s2s_${Date.now()}`,
          status: PaymentStatus.CAPTURED,
          commission,
          providerPayout,
        },
      });

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      this.logger.log(`Auto-pay test mode succeeded for booking: ${bookingId}`);
      return { autoPaid: true, status: 'captured', bookingId };
    }

    // S2S might return a pending state — poll verify API
    this.logger.log(`PayU S2S returned status: ${status}, polling verify API...`);
    await new Promise((r) => setTimeout(r, 2000));

    const verifyResult = await this.payuService.verifyPaymentAPI(txnid);
    const txnDetails = verifyResult?.transaction_details?.[txnid];

    if (txnDetails?.status === 'success') {
      const commission = Math.floor(booking.amount * 0.2);
      const providerPayout = booking.amount - commission;

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          payuMihpayId: txnDetails.mihpayid || `s2s_${Date.now()}`,
          status: PaymentStatus.CAPTURED,
          commission,
          providerPayout,
        },
      });

      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
      });

      this.logger.log(`Auto-pay verified for booking: ${bookingId}`);
      return { autoPaid: true, status: 'captured', bookingId };
    }

    this.logger.warn(`Auto-pay did not succeed for ${bookingId}, PayU status: ${txnDetails?.status}`);
    return { autoPaid: false, status: txnDetails?.status || 'unknown', bookingId };
  }

  /**
   * Verify PayU payment after checkout callback.
   * Called by the mobile app with PayU response parameters.
   */
  async verifyPayment(
    bookingId: string,
    payuResponse: {
      mihpayid: string;
      txnid: string;
      status: string;
      hash: string;
      amount: string;
      productinfo: string;
      firstname: string;
      email: string;
      error_Message?: string;
      udf1?: string;
    },
  ) {
    // Find payment by bookingId
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    // Idempotent: if already captured, return success
    if (payment.status === PaymentStatus.CAPTURED) {
      return { verified: true, status: 'already_captured' };
    }

    // Check PayU status
    if (payuResponse.status !== 'success') {
      // Update payment as failed
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          payuMihpayId: payuResponse.mihpayid,
          status: PaymentStatus.FAILED,
        },
      });

      throw new BadRequestException(
        payuResponse.error_Message || 'Payment failed at PayU',
      );
    }

    // Verify reverse hash
    const isValid = this.payuService.verifyPaymentResponse({
      txnid: payuResponse.txnid,
      amount: payuResponse.amount,
      productinfo: payuResponse.productinfo,
      firstname: payuResponse.firstname,
      email: payuResponse.email,
      status: payuResponse.status,
      hash: payuResponse.hash,
      udf1: payuResponse.udf1,
    });

    if (!isValid) {
      this.logger.error(`PayU hash verification failed for txnid: ${payuResponse.txnid}`);
      throw new BadRequestException('Invalid payment hash');
    }

    // Calculate commission (20%) and provider payout (80%)
    const commission = Math.floor(payment.amount * 0.2);
    const providerPayout = payment.amount - commission;

    // Update payment with PayU details
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        payuMihpayId: payuResponse.mihpayid,
        status: PaymentStatus.CAPTURED,
        commission,
        providerPayout,
      },
    });

    // Update booking status to CONFIRMED
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    this.logger.log(
      `Payment verified for booking: ${bookingId}, mihpayid: ${payuResponse.mihpayid}`,
    );

    return { verified: true, status: 'captured' };
  }

  /**
   * Handle PayU webhook/S2S callback.
   * PayU sends form-urlencoded POST to this endpoint.
   */
  async handleWebhook(body: any) {
    this.logger.log(`Received PayU webhook for txnid: ${body.txnid}, status: ${body.status}`);

    const txnid = body.txnid;
    if (!txnid) {
      this.logger.warn('PayU webhook missing txnid');
      return { received: true };
    }

    // Find payment by txnid
    const payment = await this.prisma.payment.findUnique({
      where: { payuTxnId: txnid },
    });

    if (!payment) {
      this.logger.error(`Payment not found for txnid: ${txnid}`);
      return { received: true };
    }

    // Verify hash
    const isValid = this.payuService.verifyPaymentResponse({
      txnid: body.txnid,
      amount: body.amount,
      productinfo: body.productinfo,
      firstname: body.firstname,
      email: body.email,
      status: body.status,
      hash: body.hash,
      udf1: body.udf1,
      additionalCharges: body.additionalCharges,
    });

    if (!isValid) {
      this.logger.error(`PayU webhook hash verification failed for txnid: ${txnid}`);
      return { received: true };
    }

    if (body.status === 'success') {
      await this.handlePaymentCaptured(payment, body);
    } else {
      await this.handlePaymentFailed(payment, body);
    }

    return { received: true };
  }

  private async handlePaymentCaptured(payment: any, body: any) {
    // Idempotent check
    if (payment.status === PaymentStatus.CAPTURED) {
      this.logger.log(`Payment already captured: ${payment.id}`);
      return;
    }

    const commission = Math.floor(payment.amount * 0.2);
    const providerPayout = payment.amount - commission;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        payuMihpayId: body.mihpayid,
        status: PaymentStatus.CAPTURED,
        commission,
        providerPayout,
      },
    });

    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CONFIRMED },
    });

    this.logger.log(`Payment captured for booking: ${payment.bookingId}`);
  }

  private async handlePaymentFailed(payment: any, body: any) {
    if (payment.status === PaymentStatus.FAILED) {
      this.logger.log(`Payment already marked as failed: ${payment.id}`);
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        payuMihpayId: body.mihpayid,
        status: PaymentStatus.FAILED,
      },
    });

    await this.prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    this.logger.log(`Payment failed for booking: ${payment.bookingId}`);
  }

  /**
   * Poll PayU's verify_payment API to check if payment was captured.
   * Used by mobile app to detect payment completion when surl/furl redirect fails.
   */
  async checkAndUpdatePaymentStatus(bookingId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found for this booking');
    }

    // Already resolved — return current status
    if (payment.status !== PaymentStatus.PENDING) {
      return { status: payment.status, captured: payment.status === PaymentStatus.CAPTURED };
    }

    // Call PayU verify API
    if (!payment.payuTxnId) {
      return { status: 'PENDING', captured: false };
    }

    try {
      const result = await this.payuService.verifyPaymentAPI(payment.payuTxnId);
      const txnStatus = result?.transaction_details?.[payment.payuTxnId]?.status;
      const mihpayid = result?.transaction_details?.[payment.payuTxnId]?.mihpayid;

      if (txnStatus === 'success') {
        const commission = Math.floor(payment.amount * 0.2);
        const providerPayout = payment.amount - commission;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            payuMihpayId: mihpayid || `verified_${Date.now()}`,
            status: PaymentStatus.CAPTURED,
            commission,
            providerPayout,
          },
        });

        await this.prisma.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });

        this.logger.log(`Payment confirmed via polling for booking: ${bookingId}`);
        return { status: 'CAPTURED', captured: true };
      }

      if (txnStatus === 'failure') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            payuMihpayId: mihpayid || null,
            status: PaymentStatus.FAILED,
          },
        });

        return { status: 'FAILED', captured: false };
      }

      return { status: 'PENDING', captured: false };
    } catch (err: any) {
      this.logger.warn(`PayU verify polling failed: ${err.message}`);
      return { status: 'PENDING', captured: false };
    }
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
              select: { id: true, name: true, email: true },
            },
            provider: {
              select: { id: true, name: true },
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

    if (!payment.payuMihpayId) {
      throw new BadRequestException('PayU transaction ID not found');
    }

    const refundAmount = Math.floor(payment.amount * (refundPercentage / 100));

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

    this.logger.log(`Initiated refund for booking: ${bookingId}`);

    return refund;
  }
}
