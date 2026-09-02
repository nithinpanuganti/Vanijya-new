import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile with private coordinates' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Get('me/completion')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Calculate live profile completion percentage and missing fields' })
  @ApiResponse({ status: 200, description: 'Profile completion calculation returned' })
  getProfileCompletion(@CurrentUser('id') userId: string) {
    return this.usersService.getProfileCompletion(userId);
  }

  @Get(':id/public')
  @ApiOperation({ summary: 'Get public profile with exact GPS coordinates masked' })
  @ApiResponse({ status: 200, description: 'Public profile returned' })
  getPublicProfile(@Param('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile details (name, photo, district, state, location, coordinates)' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, dto);
  }
}
