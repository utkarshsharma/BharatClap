import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Get payment gateway configuration' })
  @ApiResponse({ status: 200, description: 'Payment config returned' })
  async getPaymentConfig() {
    return {
      keyId: this.configService.get<string>('app.razorpay.keyId'),
    };
  }

  @Post(':bookingId/order')
  @ApiOperation({ summary: 'Create Razorpay payment order for a booking' })
  @ApiResponse({ status: 201, description: 'Payment order created' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createOrder(@Param('bookingId') bookingId: string) {
    return this.paymentsService.createPaymentOrder(bookingId);
  }

  @Post(':bookingId/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment after checkout' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 400, description: 'Invalid payment signature' })
  async verifyPayment(
    @Param('bookingId') bookingId: string,
    @Body()
    body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    if (
      !body.razorpay_order_id ||
      !body.razorpay_payment_id ||
      !body.razorpay_signature
    ) {
      throw new BadRequestException(
        'Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature',
      );
    }
    return this.paymentsService.verifyPayment(
      bookingId,
      body.razorpay_order_id,
      body.razorpay_payment_id,
      body.razorpay_signature,
    );
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get payment details by booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Payment not found',
  })
  async getPaymentByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBooking(bookingId);
  }
}
