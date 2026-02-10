import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirebaseService } from './firebase.service';
import { TwilioService } from './twilio.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FirebaseService, TwilioService],
  exports: [NotificationsService, FirebaseService, TwilioService],
})
export class NotificationsModule {}
