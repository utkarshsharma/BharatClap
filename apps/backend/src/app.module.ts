import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import configuration from './config/configuration';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AddressesModule } from './addresses/addresses.module';
import { CatalogModule } from './catalog/catalog.module';
import { SearchModule } from './search/search.module';
import { ProvidersModule } from './providers/providers.module';
import { BookingsModule } from './bookings/bookings.module';
import { RecurringModule } from './recurring/recurring.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { DisputesModule } from './disputes/disputes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '../../.env'],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('app.redis.url');
        if (!redisUrl) {
          // Fallback to localhost if Redis URL is not configured
          return {
            connection: {
              host: 'localhost',
              port: 6379,
            },
          };
        }

        // Parse Redis URL (supports redis:// and rediss:// for TLS)
        const url = new URL(redisUrl);
        const useTls = redisUrl.startsWith('rediss://');
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            password: url.password ? decodeURIComponent(url.password) : undefined,
            tls: useTls ? {} : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    CatalogModule,
    SearchModule,
    ProvidersModule,
    BookingsModule,
    RecurringModule,
    PaymentsModule,
    ReviewsModule,
    DisputesModule,
    NotificationsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
