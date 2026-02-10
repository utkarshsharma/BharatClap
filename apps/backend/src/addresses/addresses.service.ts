import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  private readonly logger = new Logger(AddressesService.name);

  constructor(private readonly prisma: PrismaService) {}

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
    await this.findById(userId, addressId);

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
