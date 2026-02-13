import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsModule } from '../payments/payments.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    PaymentsModule,
    NotificationsModule,
    BullModule.registerQueue({
      name: 'bookings',
    }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
