import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CategoriesController } from './categories.controller';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, ServicesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
