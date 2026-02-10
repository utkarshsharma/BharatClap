import { Controller, Get, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Categories')
@Controller('categories')
@Public()
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all categories',
    description: 'Returns all active categories organized in a tree structure with parent-child relationships',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          nameHi: { type: 'string', nullable: true },
          nameMr: { type: 'string', nullable: true },
          nameKn: { type: 'string', nullable: true },
          slug: { type: 'string' },
          iconUrl: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
          parentId: { type: 'string', nullable: true },
          sortOrder: { type: 'number' },
          children: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    },
  })
  async getCategories() {
    this.logger.log('Fetching all categories');
    return this.catalogService.getCategories();
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get category by slug',
    description: 'Returns a specific category with its services and child categories',
  })
  @ApiParam({
    name: 'slug',
    description: 'Category slug',
    example: 'plumbing',
  })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        nameHi: { type: 'string', nullable: true },
        nameMr: { type: 'string', nullable: true },
        nameKn: { type: 'string', nullable: true },
        slug: { type: 'string' },
        iconUrl: { type: 'string', nullable: true },
        imageUrl: { type: 'string', nullable: true },
        parentId: { type: 'string', nullable: true },
        sortOrder: { type: 'number' },
        services: {
          type: 'array',
          items: { type: 'object' },
        },
        children: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async getCategoryBySlug(@Param('slug') slug: string) {
    this.logger.log(`Fetching category with slug: ${slug}`);
    return this.catalogService.getCategoryBySlug(slug);
  }
}
