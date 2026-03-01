import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Geocode an address string into lat/lng using Google Maps Geocoding API.
   * Returns { lat, lng } or null if geocoding fails.
   */
  private async geocode(addressParts: {
    addressLine?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
  }): Promise<{ lat: number; lng: number } | null> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — skipping geocode');
      return null;
    }

    const parts = [
      addressParts.addressLine,
      addressParts.landmark,
      addressParts.city,
      addressParts.pincode,
    ].filter(Boolean);

    const query = encodeURIComponent(parts.join(', ') + ', India');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${apiKey}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        this.logger.log(`Geocoded "${parts.join(', ')}" → ${loc.lat}, ${loc.lng}`);
        return { lat: loc.lat, lng: loc.lng };
      }
      this.logger.warn(`Geocode returned ${data.status} for "${parts.join(', ')}"`);
      return null;
    } catch (err) {
      this.logger.warn(`Geocode fetch failed: ${err}`);
      return null;
    }
  }

  /** Returns true if coordinates look unset (zero or very close to zero). */
  private needsGeocode(lat?: number, lng?: number): boolean {
    return !lat || !lng || (Math.abs(lat) < 0.01 && Math.abs(lng) < 0.01);
  }

  async findAll(userId: string) {
    const addresses = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }],
    });

    return addresses;
  }

  async findById(userId: string, addressId: string) {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this address');
    }

    return address;
  }

  async create(userId: string, dto: CreateAddressDto) {
    const existingAddresses = await this.prisma.address.findMany({
      where: { userId },
    });

    const isFirstAddress = existingAddresses.length === 0;

    // Auto-geocode if lat/lng are missing or zero
    if (this.needsGeocode(dto.latitude, dto.longitude)) {
      const coords = await this.geocode({
        addressLine: dto.addressLine,
        landmark: dto.landmark,
        city: dto.city,
        pincode: dto.pincode,
      });
      if (coords) {
        dto.latitude = coords.lat;
        dto.longitude = coords.lng;
      }
    }

    const address = await this.prisma.address.create({
      data: {
        ...dto,
        userId,
        isDefault: isFirstAddress,
      },
    });

    this.logger.log(`Address created for user ${userId}: ${address.id}`);

    return address;
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto) {
    const existing = await this.findById(userId, addressId);

    // Re-geocode if address text changed or lat/lng are still zero
    const addressChanged =
      (dto.addressLine && dto.addressLine !== existing.addressLine) ||
      (dto.city && dto.city !== existing.city) ||
      (dto.pincode && dto.pincode !== existing.pincode);

    const latToCheck = dto.latitude ?? existing.latitude ?? undefined;
    const lngToCheck = dto.longitude ?? existing.longitude ?? undefined;

    if (addressChanged || this.needsGeocode(latToCheck, lngToCheck)) {
      const coords = await this.geocode({
        addressLine: dto.addressLine ?? existing.addressLine,
        landmark: dto.landmark ?? existing.landmark ?? undefined,
        city: dto.city ?? existing.city,
        pincode: dto.pincode ?? existing.pincode,
      });
      if (coords) {
        dto.latitude = coords.lat;
        dto.longitude = coords.lng;
      }
    }

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: dto,
    });

    this.logger.log(`Address updated: ${addressId}`);

    return address;
  }

  async delete(userId: string, addressId: string) {
    const address = await this.findById(userId, addressId);

    await this.prisma.address.delete({
      where: { id: addressId },
    });

    if (address.isDefault) {
      const firstAddress = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { id: 'asc' },
      });

      if (firstAddress) {
        await this.prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true },
        });
      }
    }

    this.logger.log(`Address deleted: ${addressId}`);

    return { message: 'Address deleted successfully' };
  }

  async setDefault(userId: string, addressId: string) {
    await this.findById(userId, addressId);

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    const address = await this.prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    });

    this.logger.log(`Default address set: ${addressId}`);

    return address;
  }
}
