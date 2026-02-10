import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current user' })
  @ApiResponse({
    status: 200,
    description: 'Addresses retrieved successfully',
  })
  async findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific address by ID' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Address belongs to another user',
  })
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.findById(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
  })
  async create(@CurrentUser() user: User, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(user.id, createAddressDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Address belongs to another user',
  })
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(user.id, id, updateAddressDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Address belongs to another user',
  })
  async delete(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.delete(user.id, id);
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Default address set successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Address not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Address belongs to another user',
  })
  async setDefault(@CurrentUser() user: User, @Param('id') id: string) {
    return this.addressesService.setDefault(user.id, id);
  }
}
