import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { AddProviderServiceDto, UpdateProviderServiceDto } from './dto/provider-service.dto';
import { SetAvailabilityDto } from './dto/availability.dto';
import { UpdateBankDetailsDto } from './dto/bank-details.dto';
import { ProviderQueryDto, PaginationDto } from './dto/provider-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Providers')
@Controller()
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // Provider self-management routes

  @Get('provider/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async getOwnProfile(@CurrentUser('id') userId: string) {
    return this.providersService.getOwnProfile(userId);
  }

  @Patch('provider/profile')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own provider profile' })
  @ApiResponse({ status: 200, description: 'Provider profile updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.providersService.updateProfile(userId, dto);
  }

  @Post('provider/services')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a service offering' })
  @ApiResponse({ status: 201, description: 'Service added successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile or service not found' })
  @ApiResponse({ status: 409, description: 'Provider already offers this service' })
  async addService(
    @CurrentUser('id') userId: string,
    @Body() dto: AddProviderServiceDto,
  ) {
    return this.providersService.addService(userId, dto);
  }

  @Patch('provider/services/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update service offering price' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider service not found' })
  async updateService(
    @CurrentUser('id') userId: string,
    @Param('id') providerServiceId: string,
    @Body() dto: UpdateProviderServiceDto,
  ) {
    return this.providersService.updateService(userId, providerServiceId, dto);
  }

  @Delete('provider/services/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove service offering' })
  @ApiResponse({ status: 200, description: 'Service removed successfully' })
  @ApiResponse({ status: 404, description: 'Provider service not found' })
  async removeService(
    @CurrentUser('id') userId: string,
    @Param('id') providerServiceId: string,
  ) {
    return this.providersService.removeService(userId, providerServiceId);
  }

  @Get('provider/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get weekly availability' })
  @ApiResponse({ status: 200, description: 'Availability retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async getAvailability(@CurrentUser('id') userId: string) {
    return this.providersService.getAvailability(userId);
  }

  @Patch('provider/availability')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set weekly availability' })
  @ApiResponse({ status: 200, description: 'Availability updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async setAvailability(
    @CurrentUser('id') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.providersService.setAvailability(userId, dto);
  }

  @Post('provider/portfolio')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add portfolio item' })
  @ApiResponse({ status: 201, description: 'Portfolio item added successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async addPortfolioItem(
    @CurrentUser('id') userId: string,
    @Body() body: { mediaUrl: string; mediaType: string; caption?: string },
  ) {
    return this.providersService.addPortfolioItem(
      userId,
      body.mediaUrl,
      body.mediaType,
      body.caption,
    );
  }

  @Delete('provider/portfolio/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove portfolio item' })
  @ApiResponse({ status: 200, description: 'Portfolio item removed successfully' })
  @ApiResponse({ status: 404, description: 'Portfolio item not found' })
  async removePortfolioItem(
    @CurrentUser('id') userId: string,
    @Param('id') portfolioId: string,
  ) {
    return this.providersService.removePortfolioItem(userId, portfolioId);
  }

  @Patch('provider/bank')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update bank/UPI details' })
  @ApiResponse({ status: 200, description: 'Bank details updated successfully' })
  @ApiResponse({ status: 400, description: 'At least one bank detail must be provided' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async updateBankDetails(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBankDetailsDto,
  ) {
    return this.providersService.updateBankDetails(userId, dto);
  }

  @Get('provider/earnings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get earnings summary' })
  @ApiResponse({ status: 200, description: 'Earnings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async getEarnings(@CurrentUser('id') userId: string) {
    return this.providersService.getEarnings(userId);
  }

  @Get('provider/payouts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payout history' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async getPayouts(
    @CurrentUser('id') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.providersService.getPayouts(userId, pagination);
  }

  @Post('provider/withdraw')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PROVIDER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request instant withdrawal' })
  @ApiResponse({ status: 200, description: 'Withdrawal request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient balance or bank details not set' })
  @ApiResponse({ status: 404, description: 'Provider profile not found' })
  async requestWithdrawal(@CurrentUser('id') userId: string) {
    return this.providersService.requestWithdrawal(userId);
  }

  // Customer-facing routes

  @Get('providers')
  @Public()
  @ApiOperation({ summary: 'Search providers by service' })
  @ApiResponse({ status: 200, description: 'Providers retrieved successfully' })
  async findProviders(@Query() query: ProviderQueryDto) {
    return this.providersService.findProviders(query);
  }

  @Get('providers/:id')
  @Public()
  @ApiOperation({ summary: 'Get provider public profile' })
  @ApiResponse({ status: 200, description: 'Provider profile retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderPublicProfile(@Param('id') providerId: string) {
    return this.providersService.getProviderPublicProfile(providerId);
  }

  @Post('providers/:id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add provider to favorites' })
  @ApiResponse({ status: 201, description: 'Provider added to favorites successfully' })
  @ApiResponse({ status: 404, description: 'Customer or provider not found' })
  @ApiResponse({ status: 409, description: 'Provider already in favorites' })
  async addFavorite(
    @CurrentUser('id') customerId: string,
    @Param('id') providerId: string,
  ) {
    return this.providersService.addFavorite(customerId, providerId);
  }

  @Delete('providers/:id/favorite')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove provider from favorites' })
  @ApiResponse({ status: 200, description: 'Provider removed from favorites successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async removeFavorite(
    @CurrentUser('id') customerId: string,
    @Param('id') providerId: string,
  ) {
    return this.providersService.removeFavorite(customerId, providerId);
  }

  @Get('favorites')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get favorite providers' })
  @ApiResponse({ status: 200, description: 'Favorites retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer profile not found' })
  async getFavorites(
    @CurrentUser('id') customerId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.providersService.getFavorites(customerId, pagination);
  }
}
