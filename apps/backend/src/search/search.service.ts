import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrokService } from './grok.service';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

export interface ServiceSearchResult {
  id: string;
  categoryId: string;
  name: string;
  nameHi: string | null;
  nameMr: string | null;
  nameKn: string | null;
  slug: string;
  description: string | null;
  basePrice: number;
  durationMin: number | null;
  imageUrl: string | null;
  inclusions: string[];
  exclusions: string[];
  isActive: boolean;
  sortOrder: number;
  category: {
    id: string;
    name: string;
    nameHi: string | null;
    nameMr: string | null;
    nameKn: string | null;
    slug: string;
    iconUrl: string | null;
  };
  stats: {
    providerCount: number;
    minPrice: number;
  };
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly grokService: GrokService,
  ) {}

  /**
   * AI-powered search using Grok to parse intent
   */
  async aiSearch(query: string): Promise<ServiceSearchResult[]> {
    this.logger.log(`AI search for query: "${query}"`);

    // Parse intent using Grok
    const intent = await this.grokService.parseSearchQuery(query);

    if (!intent || (!intent.serviceCategory && !intent.serviceType)) {
      this.logger.log('No intent extracted, falling back to text search');
      // Fall back to text search
      const results = await this.textSearch(query, { page: 1, limit: 20 });
      return results.data;
    }

    this.logger.log(`Extracted intent: ${JSON.stringify(intent)}`);

    // Build search conditions based on intent
    const whereConditions: Prisma.ServiceWhereInput[] = [];

    if (intent.serviceCategory || intent.serviceType) {
      const searchTerms: string[] = [];

      if (intent.serviceCategory) {
        searchTerms.push(intent.serviceCategory);
      }
      if (intent.serviceType) {
        searchTerms.push(intent.serviceType);
      }

      // Search in service name and description
      const searchConditions = searchTerms.flatMap((term) => [
        { name: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { nameHi: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { nameMr: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { nameKn: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: term, mode: Prisma.QueryMode.insensitive } },
      ]);

      whereConditions.push({
        OR: searchConditions,
      });

      // Also search in category names
      const categoryConditions = searchTerms.flatMap((term) => [
        { category: { name: { contains: term, mode: Prisma.QueryMode.insensitive } } },
        { category: { nameHi: { contains: term, mode: Prisma.QueryMode.insensitive } } },
        { category: { nameMr: { contains: term, mode: Prisma.QueryMode.insensitive } } },
        { category: { nameKn: { contains: term, mode: Prisma.QueryMode.insensitive } } },
      ]);

      whereConditions.push({
        OR: categoryConditions,
      });
    }

    const services = await this.prisma.service.findMany({
      where: {
        isActive: true,
        AND: whereConditions.length > 0 ? [{ OR: whereConditions }] : undefined,
      },
      take: 20,
      orderBy: { sortOrder: 'asc' },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            nameHi: true,
            nameMr: true,
            nameKn: true,
            slug: true,
            iconUrl: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          select: {
            customPrice: true,
          },
        },
      },
    });

    // Enrich with stats
    const results: ServiceSearchResult[] = services.map((service) => {
      const providerCount = service.providerServices.length;
      const prices = service.providerServices
        .map((ps) => ps.customPrice || service.basePrice)
        .filter((price) => price > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : service.basePrice;

      const { providerServices, ...serviceData } = service;

      return {
        ...serviceData,
        stats: {
          providerCount,
          minPrice,
        },
      };
    });

    this.logger.log(`AI search found ${results.length} results`);
    return results;
  }

  /**
   * Text-based search using PostgreSQL full-text search
   */
  async textSearch(
    q: string,
    pagination: { page?: number; limit?: number },
  ): Promise<PaginatedResponseDto<ServiceSearchResult>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    this.logger.log(`Text search for query: "${q}" (page ${page}, limit ${limit})`);

    try {
      // Try full-text search using searchVector
      const searchQuery = q.trim().split(/\s+/).join(' & ');

      const ftsResults = await this.prisma.$queryRaw<any[]>`
        SELECT
          s.id,
          ts_rank(s."searchVector", to_tsquery('english', ${searchQuery})) as rank
        FROM "Service" s
        WHERE s."isActive" = true
          AND s."searchVector" @@ to_tsquery('english', ${searchQuery})
        ORDER BY rank DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `;

      const ftsCount = await this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::int as count
        FROM "Service" s
        WHERE s."isActive" = true
          AND s."searchVector" @@ to_tsquery('english', ${searchQuery})
      `;

      if (ftsResults.length > 0) {
        this.logger.log(`FTS found ${ftsResults.length} results`);

        // Fetch full service details
        const serviceIds = ftsResults.map((r) => r.id);
        const services = await this.prisma.service.findMany({
          where: { id: { in: serviceIds } },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                nameHi: true,
                nameMr: true,
                nameKn: true,
                slug: true,
                iconUrl: true,
              },
            },
            providerServices: {
              where: { isActive: true },
              select: {
                customPrice: true,
              },
            },
          },
        });

        // Maintain FTS ranking order
        const serviceMap = new Map(services.map((s) => [s.id, s]));
        const orderedServices = serviceIds
          .map((id) => serviceMap.get(id))
          .filter((s): s is NonNullable<typeof s> => s !== undefined);

        const total = Number(ftsCount[0].count);

        const results: ServiceSearchResult[] = orderedServices.map((service) => {
          const providerCount = service.providerServices.length;
          const prices = service.providerServices
            .map((ps) => ps.customPrice || service.basePrice)
            .filter((price) => price > 0);
          const minPrice = prices.length > 0 ? Math.min(...prices) : service.basePrice;

          const { providerServices, ...serviceData } = service;

          return {
            ...serviceData,
            stats: {
              providerCount,
              minPrice,
            },
          };
        });

        return new PaginatedResponseDto(results, total, page, limit);
      }
    } catch (error: any) {
      this.logger.warn(`FTS failed, falling back to ILIKE: ${error.message}`);
    }

    // Fallback to ILIKE search
    this.logger.log('Using ILIKE fallback search');

    const searchTerm = `%${q}%`;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameHi: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameMr: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameKn: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { category: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameHi: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameMr: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameKn: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          ],
        },
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameHi: true,
              nameMr: true,
              nameKn: true,
              slug: true,
              iconUrl: true,
            },
          },
          providerServices: {
            where: { isActive: true },
            select: {
              customPrice: true,
            },
          },
        },
      }),
      this.prisma.service.count({
        where: {
          isActive: true,
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameHi: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameMr: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { nameKn: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { category: { name: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameHi: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameMr: { contains: q, mode: Prisma.QueryMode.insensitive } } },
            { category: { nameKn: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          ],
        },
      }),
    ]);

    const results: ServiceSearchResult[] = services.map((service) => {
      const providerCount = service.providerServices.length;
      const prices = service.providerServices
        .map((ps) => ps.customPrice || service.basePrice)
        .filter((price) => price > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : service.basePrice;

      const { providerServices, ...serviceData } = service;

      return {
        ...serviceData,
        stats: {
          providerCount,
          minPrice,
        },
      };
    });

    this.logger.log(`ILIKE search found ${total} total results`);
    return new PaginatedResponseDto(results, total, page, limit);
  }
}
