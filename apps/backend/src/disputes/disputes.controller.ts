import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { DisputesService } from './disputes.service';
import { CreateDisputeDto, RespondDisputeDto } from './dto/create-dispute.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@ApiTags('Disputes')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post('bookings/:id/dispute')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Open a dispute for a booking' })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 201,
    description: 'Dispute opened successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async openDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id') bookingId: string,
    @Body() dto: CreateDisputeDto,
  ) {
    return this.disputesService.openDispute(user.sub, bookingId, dto);
  }

  @Post('disputes/:id/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Provider responds to a dispute' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Response submitted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async respondToDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id') disputeId: string,
    @Body() dto: RespondDisputeDto,
  ) {
    return this.disputesService.respondToDispute(user.sub, disputeId, dto);
  }

  @Get('disputes/:id')
  @ApiOperation({ summary: 'Get dispute details' })
  @ApiParam({ name: 'id', description: 'Dispute ID' })
  @ApiResponse({
    status: 200,
    description: 'Dispute details retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Dispute not found' })
  async getDispute(
    @CurrentUser() user: JwtPayload,
    @Param('id') disputeId: string,
  ) {
    return this.disputesService.getDispute(user.sub, disputeId, user.role as any);
  }
}
