import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetRoleDto } from './dto/set-role.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '@prisma/client';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with Firebase ID token' })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid Firebase token',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.firebaseIdToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('set-role')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set user role (CUSTOMER or PROVIDER)' })
  @ApiResponse({
    status: 200,
    description: 'Role successfully set',
  })
  @ApiResponse({
    status: 403,
    description: 'Role already set or cannot be changed',
  })
  async setRole(@CurrentUser() user: User, @Body() setRoleDto: SetRoleDto) {
    return this.authService.setRole(user.id, setRoleDto.role);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'New tokens generated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged out',
  })
  async logout(@CurrentUser() user: User) {
    return this.authService.logout(user.id);
  }
}
