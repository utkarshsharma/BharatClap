import { Controller, Get, Patch, Delete, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfile(@CurrentUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(user.id, updateUserDto);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete current user account (DPDP compliance)' })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteAccount(@CurrentUser() user: User) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get('me/data-export')
  @ApiOperation({ summary: 'Export all user data (DPDP compliance)' })
  @ApiResponse({
    status: 200,
    description: 'User data exported successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async exportData(@CurrentUser() user: User) {
    return this.usersService.exportData(user.id);
  }
}
