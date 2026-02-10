import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingQueryDto } from './dto/booking-query.dto';
import { CancelBookingDto, RejectBookingDto, VerifyOtpDto } from './dto/update-status.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
@UseGuards(RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or invalid booking details',
  })
  @ApiResponse({
    status: 404,
    description: 'Service, provider, or address not found',
  })
  async create(
    @CurrentUser('id') customerId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(customerId, createBookingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bookings for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of bookings retrieved successfully',
  })
  async findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Query() query: BookingQueryDto,
  ) {
    return this.bookingsService.findAll(userId, role, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking details retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.findById(userId, id);
  }

  @Patch(':id/accept')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Provider accepts a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking accepted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async acceptBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.acceptBooking(providerId, id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Provider rejects a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking rejected successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async rejectBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') id: string,
    @Body() rejectBookingDto: RejectBookingDto,
  ) {
    return this.bookingsService.rejectBooking(providerId, id, rejectBookingDto);
  }

  @Post(':id/verify-otp')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Provider verifies OTP to start booking' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully, booking started',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP code or status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async verifyOtp(
    @CurrentUser('id') providerId: string,
    @Param('id') id: string,
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.bookingsService.verifyOtp(providerId, id, verifyOtpDto);
  }

  @Patch(':id/complete')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Provider marks booking as complete' })
  @ApiResponse({
    status: 200,
    description: 'Booking completed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition',
  })
  @ApiResponse({
    status: 403,
    description: 'Not assigned to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async completeBooking(
    @CurrentUser('id') providerId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.completeBooking(providerId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel booking in current status',
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to cancel this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  async cancelBooking(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(userId, id, cancelBookingDto);
  }

  @Post(':id/rebook')
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Rebook a previous booking' })
  @ApiResponse({
    status: 201,
    description: 'Booking rebooked successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'No permission to rebook this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Original booking not found',
  })
  async rebookBooking(
    @CurrentUser('id') customerId: string,
    @Param('id') id: string,
  ) {
    return this.bookingsService.rebookBooking(customerId, id);
  }
}
