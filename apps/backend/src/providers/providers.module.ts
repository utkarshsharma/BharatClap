import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProvidersController } from './providers.controller';
import { SetuKycService } from './setu-kyc.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProvidersController],
  providers: [ProvidersService, SetuKycService],
  exports: [ProvidersService, SetuKycService],
})
export class ProvidersModule {}
