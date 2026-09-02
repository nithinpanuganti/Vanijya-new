import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { CaptchaService, CaptchaResponse } from './captcha.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RegisterResponseDto, UserProfileDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Request } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly captchaService: CaptchaService,
  ) {}

  @Get('captcha')
  @ApiOperation({ summary: 'Generate a new visual alphanumeric CAPTCHA challenge' })
  @ApiResponse({ status: 200, description: 'Visual CAPTCHA challenge generated with base64 SVG image' })
  getCaptcha(@Req() req: Request): CaptchaResponse {
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const remoteIp = Array.isArray(rawIp) ? rawIp[0] : typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : undefined;
    return this.captchaService.generateCaptcha(remoteIp);
  }

  @Post('register')
  @UseInterceptors(FileInterceptor('profilePhoto', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({ summary: 'Register a new Farmer or Buyer with multipart profile photo for administrative approval' })
  @ApiResponse({ status: 201, type: RegisterResponseDto, description: 'Registration successfully submitted' })
  @ApiResponse({ status: 400, description: 'Validation failed or admin signup blocked' })
  @ApiResponse({ status: 409, description: 'Phone or email already registered' })
  register(
    @Body() dto: RegisterDto,
    @UploadedFile() file?: any,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(dto, file);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with phone/email, password, and visual CAPTCHA verification' })
  @ApiResponse({ status: 200, type: AuthResponseDto, description: 'Login successful with JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials, pending approval, or CAPTCHA failure' })
  login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const rawIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip;
    const remoteIp = Array.isArray(rawIp) ? rawIp[0] : typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : undefined;
    return this.authService.login(dto, remoteIp);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserProfileDto, description: 'Authenticated profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMe(@CurrentUser() user: UserProfileDto): UserProfileDto {
    return user;
  }
}
