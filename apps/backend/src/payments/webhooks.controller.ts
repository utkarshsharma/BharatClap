import { Controller, Post, Req, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Request } from 'express';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('razorpay')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle Razorpay webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
  })
  async handleRazorpayWebhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    try {
      const body = req.body;

      this.logger.log(`Received Razorpay webhook: ${body.event}`);

      // Process webhook
      await this.paymentsService.handleWebhook(body, signature);

      // Always return 200 OK to Razorpay
      return { status: 'ok' };
    } catch (error: any) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      // Still return 200 to prevent Razorpay from retrying
      return { status: 'ok' };
    }
  }
}
