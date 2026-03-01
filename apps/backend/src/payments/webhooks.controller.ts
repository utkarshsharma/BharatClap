import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('payu')
  @ApiExcludeEndpoint()
  @ApiOperation({ summary: 'Handle PayU webhook events' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handlePayuWebhook(@Body() body: any) {
    try {
      this.logger.log(`Received PayU webhook: txnid=${body.txnid}, status=${body.status}`);
      await this.paymentsService.handleWebhook(body);
      return { status: 'ok' };
    } catch (error: any) {
      this.logger.error(`Webhook processing error: ${error.message}`);
      // Always return 200 OK to prevent PayU from retrying
      return { status: 'ok' };
    }
  }
}
