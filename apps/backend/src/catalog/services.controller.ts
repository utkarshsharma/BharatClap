import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { ServiceQueryDto } from './dto/service-query.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Services')
@Controller('services')
@Public()
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all services',
    description: 'Returns paginated list of services with filtering and sorting options',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              categoryId: { type: 'string' },
              name: { type: 'string' },
              nameHi: { type: 'string', nullable: true },
              nameMr: { type: 'string', nullable: true },
              nameKn: { type: 'string', nullable: true },
              slug: { type: 'string' },
              description: { type: 'string', nullable: true },
              basePrice: { type: 'number', description: 'Price in paise' },
              durationMin: { type: 'number', nullable: true },
              imageUrl: { type: 'string', nullable: true },
              inclusions: { type: 'array', items: { type: 'string' } },
              exclusions: { type: 'array', items: { type: 'string' } },
              isActive: { type: 'boolean' },
              sortOrder: { type: 'number' },
              category: { type: 'object' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPrevPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getServices(@Query() query: ServiceQueryDto) {
    this.logger.log(`Fetching services with query: ${JSON.stringify(query)}`);
    return this.catalogService.getServices(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get service by slug',
    description: 'Returns detailed information about a specific service including pricing, providers, and review statistics',
  })
  @ApiParam({
    name: 'slug',
    description: 'Service slug',
    example: 'tap-repair',
  })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        categoryId: { type: 'string' },
        name: { type: 'string' },
        nameHi: { type: 'string', nullable: true },
        nameMr: { type: 'string', nullable: true },
        nameKn: { type: 'string', nullable: true },
        slug: { type: 'string' },
        description: { type: 'string', nullable: true },
        basePrice: { type: 'number', description: 'Price in paise' },
        durationMin: { type: 'number', nullable: true },
        imageUrl: { type: 'string', nullable: true },
        inclusions: { type: 'array', items: { type: 'string' } },
        exclusions: { type: 'array', items: { type: 'string' } },
        category: { type: 'object' },
        stats: {
          type: 'object',
          properties: {
            averageRating: { type: 'number' },
            reviewCount: { type: 'number' },
            providerCount: { type: 'number' },
            minPrice: { type: 'number', description: 'Minimum price in paise' },
            maxPrice: { type: 'number', description: 'Maximum price in paise' },
          },
        },
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              businessName: { type: 'string' },
              rating: { type: 'number' },
              reviewCount: { type: 'number' },
              price: { type: 'number', description: 'Price in paise' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found',
  })
  async getServiceBySlug(
    @Param('slug') slug: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
  ) {
    this.logger.log(`Fetching service with slug: ${slug}, lat: ${lat}, lng: ${lng}`);
    const latNum = lat ? parseFloat(lat) : undefined;
    const lngNum = lng ? parseFloat(lng) : undefined;
    return this.catalogService.getServiceBySlug(slug, latNum, lngNum);
  }
}
