import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceQueryDto, ServiceSortOption } from './dto/service-query.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class CatalogService {
  private readonly logger = new Logger(CatalogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all active categories organized as a tree structure
   */
  async getCategories() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        nameHi: true,
        nameMr: true,
        nameKn: true,
        slug: true,
        iconUrl: true,
        imageUrl: true,
        parentId: true,
        sortOrder: true,
      },
    });

    // Build tree structure
    const categoryMap = new Map(categories.map((cat) => [cat.id, { ...cat, children: [] as any[] }]));
    const tree: any[] = [];

    categories.forEach((category) => {
      const node = categoryMap.get(category.id);
      if (!node) return;

      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  /**
   * Get category by slug with its services
   */
  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug, isActive: true },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            nameHi: true,
            nameMr: true,
            nameKn: true,
            slug: true,
            description: true,
            basePrice: true,
            durationMin: true,
            imageUrl: true,
            inclusions: true,
            exclusions: true,
            sortOrder: true,
          },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            nameHi: true,
            nameMr: true,
            nameKn: true,
            slug: true,
            iconUrl: true,
            imageUrl: true,
            sortOrder: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Get paginated services with filters
   */
  async getServices(query: ServiceQueryDto) {
    const { page = 1, limit = 20, categorySlug, city, sort, minPrice, maxPrice } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: categorySlug, isActive: true },
        select: { id: true },
      });

      if (!category) {
        throw new NotFoundException(`Category with slug '${categorySlug}' not found`);
      }

      where.categoryId = category.id;
    }

    // Filter by city: only show services that have at least one provider in the given city
    if (city) {
      where.providerServices = {
        some: {
          isActive: true,
          provider: {
            user: {
              city: {
                contains: city,
                mode: 'insensitive',
              },
            },
          },
        },
      };
    }

    // Price filter (convert rupees to paise)
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) {
        where.basePrice.gte = Math.round(minPrice * 100);
      }
      if (maxPrice !== undefined) {
        where.basePrice.lte = Math.round(maxPrice * 100);
      }
    }

    // Build orderBy clause
    let orderBy: any = { sortOrder: 'asc' };

    if (sort) {
      switch (sort) {
        case ServiceSortOption.PRICE_ASC:
          orderBy = { basePrice: 'asc' };
          break;
        case ServiceSortOption.PRICE_DESC:
          orderBy = { basePrice: 'desc' };
          break;
        case ServiceSortOption.NEWEST:
          orderBy = { createdAt: 'desc' };
          break;
        case ServiceSortOption.POPULAR:
          // For popular, we'll need to join with provider services count
          // For now, use sortOrder as a proxy
          orderBy = { sortOrder: 'asc' };
          break;
        default:
          orderBy = { sortOrder: 'asc' };
      }
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return new PaginatedResponseDto(services, total, page, limit);
  }

  /**
   * Get service by slug with detailed information
   */
  async getServiceBySlug(slug: string, lat?: number, lng?: number) {
    const service = await this.prisma.service.findUnique({
      where: { slug, isActive: true },
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
            imageUrl: true,
          },
        },
        providerServices: {
          where: { isActive: true },
          select: {
            id: true,
            customPrice: true,
            provider: {
              select: {
                id: true,
                bio: true,
                avgRating: true,
                totalJobs: true,
                baseLatitude: true,
                baseLongitude: true,
                serviceRadiusKm: true,
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with slug '${slug}' not found`);
    }

    // Map providers with optional distance
    let providers = service.providerServices.map((ps: any) => {
      const base: any = {
        id: ps.provider.id,
        userId: ps.provider.user?.id,
        name: ps.provider.user?.name || 'Service Provider',
        bio: ps.provider.bio,
        avgRating: ps.provider.avgRating,
        totalJobs: ps.provider.totalJobs,
        price: ps.customPrice || service.basePrice,
      };

      if (
        lat !== undefined &&
        lng !== undefined &&
        ps.provider.baseLatitude &&
        ps.provider.baseLongitude
      ) {
        base.distance = this.calculateDistance(
          lat,
          lng,
          ps.provider.baseLatitude,
          ps.provider.baseLongitude,
        );
      }

      return base;
    });

    // When lat/lng provided, filter out providers beyond 50km and sort by distance
    if (lat !== undefined && lng !== undefined) {
      providers = providers
        .filter((p: any) => p.distance !== undefined && p.distance <= 50)
        .sort((a: any, b: any) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }

    // Calculate aggregate statistics
    const providerCount = providers.length;

    const prices = providers
      .map((p: any) => p.price)
      .filter((price: number) => price > 0);

    const minPrice = prices.length > 0 ? Math.min(...prices) : service.basePrice;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : service.basePrice;

    // Get review statistics
    const reviewStats = await this.prisma.review.aggregate({
      where: {
        booking: {
          serviceId: service.id,
        },
      },
      _avg: {
        ratingOverall: true,
      },
      _count: true,
    });

    const { providerServices, ...serviceData } = service;

    return {
      ...serviceData,
      stats: {
        averageRating: reviewStats._avg?.ratingOverall || 0,
        reviewCount: reviewStats._count || 0,
        providerCount,
        minPrice,
        maxPrice,
      },
      providers,
    };
  }

  // Haversine distance calculation (returns km)
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
