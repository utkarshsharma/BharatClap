import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { AiSearchDto, TextSearchDto } from './dto/search.dto';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
@Public()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({
    summary: 'AI-powered search',
    description: 'Search services using natural language. Uses Grok AI to parse intent and find relevant services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
    schema: {
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
          category: { type: 'object' },
          stats: {
            type: 'object',
            properties: {
              providerCount: { type: 'number' },
              minPrice: { type: 'number', description: 'Minimum price in paise' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid search query',
  })
  async aiSearch(@Body() dto: AiSearchDto) {
    this.logger.log(`AI search request: "${dto.query}"`);
    return this.searchService.aiSearch(dto.query);
  }

  @Get('text')
  @ApiOperation({
    summary: 'Text search',
    description: 'Search services using traditional text search with full-text search capabilities.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results returned successfully',
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
              category: { type: 'object' },
              stats: {
                type: 'object',
                properties: {
                  providerCount: { type: 'number' },
                  minPrice: { type: 'number', description: 'Minimum price in paise' },
                },
              },
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
  @ApiResponse({
    status: 400,
    description: 'Invalid search query',
  })
  async textSearch(@Query() dto: TextSearchDto) {
    this.logger.log(`Text search request: "${dto.q}" (page ${dto.page}, limit ${dto.limit})`);
    return this.searchService.textSearch(dto.q, {
      page: dto.page,
      limit: dto.limit,
    });
  }
}
