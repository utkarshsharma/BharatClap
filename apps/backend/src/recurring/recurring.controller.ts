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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RecurringService } from './recurring.service';
import { CreateRecurringDto } from './dto/create-recurring.dto';
import { UpdateRecurringDto } from './dto/update-recurring.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Recurring Bookings')
@ApiBearerAuth()
@Controller('recurring')
@UseGuards(RolesGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new recurring booking' })
  @ApiResponse({
    status: 201,
    description: 'Recurring booking created successfully',
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
    @Body() createRecurringDto: CreateRecurringDto,
  ) {
    return this.recurringService.create(customerId, createRecurringDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recurring bookings for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of recurring bookings retrieved successfully',
  })
  async findAll(@CurrentUser('id') userId: string) {
    return this.recurringService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recurring booking details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring booking details retrieved successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this recurring booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring booking not found',
  })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringService.findById(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a recurring booking' })
  @ApiResponse({
    status: 200,
    description: 'Recurring booking updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot update inactive recurring booking',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this recurring booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring booking not found',
  })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateRecurringDto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(userId, id, updateRecurringDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel (deactivate) a recurring booking' })
  @ApiResponse({
    status: 200,
    description: 'Recurring booking cancelled successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this recurring booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring booking not found',
  })
  async cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringService.cancel(userId, id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm next occurrence - create a real booking' })
  @ApiResponse({
    status: 201,
    description: 'Next booking confirmed and created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot confirm - invalid state or timing',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this recurring booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring booking not found',
  })
  async confirmNext(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringService.confirmNext(userId, id);
  }

  @Post(':id/skip')
  @ApiOperation({ summary: 'Skip next occurrence' })
  @ApiResponse({
    status: 200,
    description: 'Next occurrence skipped successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot skip - inactive recurring booking',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this recurring booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring booking not found',
  })
  async skipNext(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.recurringService.skipNext(userId, id);
  }
}
