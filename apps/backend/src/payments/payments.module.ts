import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService, RazorpayService],
})
export class PaymentsModule {}
