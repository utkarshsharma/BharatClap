import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import {
  AdminBookingQueryDto,
  AdminProviderQueryDto,
} from './dto/admin-query.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { OverrideDisputeDto } from '../disputes/dto/override-dispute.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard metrics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard metrics retrieved successfully',
  })
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings with filters' })
  @ApiResponse({
    status: 200,
    description: 'Bookings retrieved successfully',
  })
  async getBookings(@Query() query: AdminBookingQueryDto) {
    return this.adminService.getBookings(query);
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all providers with filters' })
  @ApiResponse({
    status: 200,
    description: 'Providers retrieved successfully',
  })
  async getProviders(@Query() query: AdminProviderQueryDto) {
    return this.adminService.getProviders(query);
  }

  @Get('providers/:id')
  @ApiOperation({ summary: 'Get single provider detail' })
  @ApiParam({ name: 'id', description: 'Provider (user) ID' })
  @ApiResponse({ status: 200, description: 'Provider detail retrieved' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderDetail(@Param('id') providerId: string) {
    return this.adminService.getProviderDetail(providerId);
  }

  @Patch('providers/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a provider (verify KYC)' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider approved successfully',
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async approveProvider(@Param('id') providerId: string) {
    return this.adminService.approveProvider(providerId);
  }

  @Patch('providers/:id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspend a provider' })
  @ApiParam({ name: 'id', description: 'Provider ID' })
  @ApiResponse({
    status: 200,
    description: 'Provider suspended successfully',
  })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async suspendProvider(@Param('id') providerId: string) {
    return this.adminService.suspendProvider(providerId);
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get payments overview' })
  @ApiResponse({
    status: 200,
    description: 'Payments overview retrieved successfully',
  })
  async getPaymentsOverview() {
    return this.adminService.getPaymentsOverview();
  }

  @Post('payouts/batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger batch payout processing' })
  @ApiResponse({
    status: 200,
    description: 'Batch payout triggered successfully',
  })
  async triggerBatchPayout() {
    return this.adminService.triggerBatchPayout();
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Get all disputes (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Disputes retrieved successfully',
  })
  async getDisputes(@Query() pagination: PaginationDto) {
    return this.adminService.getDisputes(pagination);
  }

  @Patch('disputes/:id/override')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Override dispute ruling (admin override)' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute overridden successfully',
  })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async overrideDispute(
    @Param('id') disputeId: string,
    @Body() dto: OverrideDisputeDto,
  ) {
    return this.adminService.overrideDispute(disputeId, dto);
  }
}
