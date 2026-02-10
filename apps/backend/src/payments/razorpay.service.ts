import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;
  private webhookSecret: string;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('app.razorpay.keyId');
    const keySecret = this.configService.get<string>('app.razorpay.keySecret');
    this.webhookSecret = this.configService.get<string>('app.razorpay.webhookSecret', '');

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amount: number, bookingId: string) {
    try {
      const order = await this.razorpay.orders.create({
        amount: amount, // amount in paise
        currency: 'INR',
        receipt: bookingId,
      });

      this.logger.log(`Created Razorpay order: ${order.id} for booking: ${bookingId}`);
      return order;
    } catch (error: any) {
      this.logger.error(`Failed to create Razorpay order: ${error.message}`);
      throw error;
    }
  }

  verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
    try {
      const text = `${orderId}|${paymentId}`;
      const generatedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(text)
        .digest('hex');

      return generatedSignature === signature;
    } catch (error: any) {
      this.logger.error(`Failed to verify payment signature: ${error.message}`);
      return false;
    }
  }

  async initiateRefund(paymentId: string, amount: number) {
    try {
      const refund = await this.razorpay.payments.refund(paymentId, {
        amount: amount, // amount in paise
      });

      this.logger.log(`Created refund: ${refund.id} for payment: ${paymentId}`);
      return refund;
    } catch (error: any) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw error;
    }
  }

  async createTransfer(paymentId: string, amount: number, providerId: string) {
    // Placeholder for Razorpay Route transfer to provider
    // This would require the provider to have a linked account with Razorpay
    this.logger.log(
      `Transfer placeholder - PaymentId: ${paymentId}, Amount: ${amount}, ProviderId: ${providerId}`,
    );
    // Future implementation:
    // const transfer = await this.razorpay.payments.transfer(paymentId, {
    //   transfers: [
    //     {
    //       account: providerAccountId,
    //       amount: amount,
    //       currency: 'INR',
    //     },
    //   ],
    // });
    // return transfer;
    return null;
  }
}
