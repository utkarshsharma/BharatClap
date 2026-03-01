import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PayuService } from './payu.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly payuService: PayuService,
  ) {}

  @Get('config')
  @Public()
  @ApiOperation({ summary: 'Get payment gateway configuration' })
  @ApiResponse({ status: 200, description: 'Payment config returned' })
  async getPaymentConfig() {
    // PAYU_TEST_MODE_AUTO=true  → skip checkout, instant confirm (fast dev iteration)
    // PAYU_TEST_MODE_AUTO=false → show real PayU checkout (realistic demo/testing)
    const autoTest =
      this.payuService.isTestMode() &&
      (process.env.PAYU_TEST_MODE_AUTO ?? 'true') === 'true';

    return {
      merchantKey: this.payuService.getMerchantKey(),
      gateway: autoTest ? 'payu_test_auto' : 'payu',
    };
  }

  @Post(':bookingId/order')
  @UsePipes()
  @ApiOperation({ summary: 'Create PayU payment for a booking' })
  @ApiResponse({ status: 201, description: 'Payment initiated' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async createOrder(
    @Param('bookingId') bookingId: string,
    @Body() body: { callbackBaseUrl?: string; autoPayTest?: boolean },
  ) {
    if (body.autoPayTest && this.payuService.isTestMode()) {
      return this.paymentsService.autoPayTestMode(bookingId);
    }
    return this.paymentsService.createPaymentOrder(bookingId, undefined, body.callbackBaseUrl);
  }

  @Post(':bookingId/verify')
  @ApiOperation({ summary: 'Verify PayU payment after checkout' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  @ApiResponse({ status: 400, description: 'Invalid payment hash' })
  async verifyPayment(
    @Param('bookingId') bookingId: string,
    @Body()
    body: {
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
    if (!body.mihpayid || !body.txnid || !body.status || !body.hash) {
      throw new BadRequestException(
        'Missing required fields: mihpayid, txnid, status, hash',
      );
    }
    return this.paymentsService.verifyPayment(bookingId, body);
  }

  /**
   * PayU surl/furl callback endpoint.
   * PayU redirects here after payment (success or failure).
   * Returns an HTML page that posts the result back to the WebView.
   */
  @Post('payu/callback')
  @Public()
  @UsePipes()
  @ApiOperation({ summary: 'PayU payment callback (surl/furl)' })
  async payuCallback(@Req() req: Request, @Res() res: Response) {
    const body = req.body;
    // Return HTML that posts the PayU response to the React Native WebView
    const responseJson = JSON.stringify(body);
    const html = `<!DOCTYPE html>
<html>
<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body>
  <script>
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'payu_response',
        data: ${responseJson}
      }));
    } catch(e) {
      document.body.innerHTML = '<p>Payment processed. You can close this window.</p>';
    }
  </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get(':bookingId/status')
  @ApiOperation({ summary: 'Check payment status via PayU verify API' })
  @ApiResponse({ status: 200, description: 'Payment status returned' })
  async checkPaymentStatus(@Param('bookingId') bookingId: string) {
    return this.paymentsService.checkAndUpdatePaymentStatus(bookingId);
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get payment details by booking ID' })
  @ApiResponse({ status: 200, description: 'Payment details retrieved' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBooking(bookingId);
  }
}
