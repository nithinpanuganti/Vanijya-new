import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { CaptchaService } from './captcha.service';
import { JwtService } from '@nestjs/jwt';
import { Role, ApprovalStatus, VerificationStatus } from '@prisma/client';
import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UploadsService } from '../uploads/uploads.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let captchaService: CaptchaService;
  let uploadsService: UploadsService;

  const mockPrismaService = {
    isConnected: true,
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockCaptchaService = {
    isCaptchaEnabled: jest.fn().mockReturnValue(true),
    verifyCaptcha: jest.fn().mockImplementation((captchaId?: string, answer?: string) => {
      if (!captchaId || !answer) {
        return { success: false, error: 'Please enter the CAPTCHA.' };
      }
      if (captchaId === 'valid-captcha-id' && answer.toUpperCase() === 'K7P4X') {
        return { success: true };
      }
      return { success: false, error: 'Incorrect CAPTCHA. Please try again.' };
    }),
  };

  const mockAuditService = {
    log: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const mockNotificationsService = {
    create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    notifyAdmins: jest.fn().mockResolvedValue(undefined),
  };

  const mockUploadsService = {
    saveFile: jest.fn().mockImplementation(async (file: any) => {
      if (!file || !file.buffer) throw new BadRequestException('File is required.');
      if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Profile photo exceeds the 5 MB size limit.');
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowed.includes(file.mimetype)) throw new BadRequestException('Invalid image format. Only JPG, PNG, and WebP are allowed.');
      return { url: '/api/uploads/profile-photos/mock-photo.jpg', filename: 'mock-photo.jpg', path: '/uploads/mock-photo.jpg' };
    }),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    saveBase64Image: jest.fn().mockResolvedValue({ url: '/api/uploads/profile-photos/mock-photo.jpg', filename: 'mock-photo.jpg', path: '/uploads/mock-photo.jpg' }),
    getFilePath: jest.fn().mockReturnValue('/uploads/mock-photo.jpg'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CaptchaService, useValue: mockCaptchaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    captchaService = module.get<CaptchaService>(CaptchaService);
    uploadsService = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('1. should register a new farmer with multipart file and PENDING approval status without issuing JWT', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'farmer-uuid-1',
        name: 'Ramesh Patel',
        phone: '9876543210',
        email: 'ramesh@farmer.in',
        role: Role.FARMER,
        district: 'Nashik',
        state: 'Maharashtra',
        village: 'Pimpalgaon',
        location: 'Pimpalgaon, Nashik, Maharashtra',
        latitude: 20.1704,
        longitude: 73.9877,
        profilePhotoUrl: '/api/uploads/profile-photos/mock-photo.jpg',
        approvalStatus: ApprovalStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
        isVerified: false,
      });

      const mockFile = {
        buffer: Buffer.from('fake-image-content'),
        mimetype: 'image/jpeg',
        size: 1024 * 500,
        originalname: 'ramesh.jpg',
      };

      const result = await service.register(
        {
          name: 'Ramesh Patel',
          phone: '9876543210',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Nashik',
          state: 'Maharashtra',
          village: 'Pimpalgaon',
          latitude: 20.1704,
          longitude: 73.9877,
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        },
        mockFile,
      );

      expect(result).toHaveProperty('message');
      expect(result.user.name).toEqual('Ramesh Patel');
      expect(result.user.role).toEqual(Role.FARMER);
      expect(result.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
      expect(mockUploadsService.saveFile).toHaveBeenCalledWith(mockFile);
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockNotificationsService.notifyAdmins).toHaveBeenCalled();
    });

    it('2. should reject public registration with ADMIN role', async () => {
      await expect(
        service.register({
          name: 'Fake Admin',
          email: 'fake@admin.in',
          password: 'Password@123',
          role: Role.ADMIN,
          district: 'Nashik',
          state: 'Maharashtra',
          latitude: 20.1704,
          longitude: 73.9877,
          profilePhotoUrl: '/api/uploads/profile-photos/photo-1.jpg',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('3. should reject invalid state name', async () => {
      await expect(
        service.register({
          name: 'Ramesh Patel',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Nashik',
          state: 'NonExistentState',
          latitude: 20.1704,
          longitude: 73.9877,
          profilePhotoUrl: '/api/uploads/profile-photos/photo-1.jpg',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. should reject district not belonging to state', async () => {
      await expect(
        service.register({
          name: 'Ramesh Patel',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Guntur', // Guntur is in Andhra Pradesh, not Maharashtra
          state: 'Maharashtra',
          latitude: 20.1704,
          longitude: 73.9877,
          profilePhotoUrl: '/api/uploads/profile-photos/photo-1.jpg',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('5. should reject registration without profile photo and without file', async () => {
      await expect(
        service.register({
          name: 'Ramesh Patel',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Nashik',
          state: 'Maharashtra',
          latitude: 20.1704,
          longitude: 73.9877,
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('6. should reject registration when file exceeds 5MB', async () => {
      const oversizedFile = {
        buffer: Buffer.from('large-image-data'),
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
      };

      await expect(
        service.register(
          {
            name: 'Ramesh Patel',
            email: 'ramesh@farmer.in',
            password: 'Password@123',
            role: Role.FARMER,
            district: 'Nashik',
            state: 'Maharashtra',
            latitude: 20.1704,
            longitude: 73.9877,
            captchaId: 'valid-captcha-id',
            captchaAnswer: 'K7P4X',
          },
          oversizedFile,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('7. should reject registration when file MIME is unsupported (e.g. executable/text)', async () => {
      const unsupportedFile = {
        buffer: Buffer.from('script-data'),
        mimetype: 'application/x-msdownload',
        size: 1024,
      };

      await expect(
        service.register(
          {
            name: 'Ramesh Patel',
            email: 'ramesh@farmer.in',
            password: 'Password@123',
            role: Role.FARMER,
            district: 'Nashik',
            state: 'Maharashtra',
            latitude: 20.1704,
            longitude: 73.9877,
            captchaId: 'valid-captcha-id',
            captchaAnswer: 'K7P4X',
          },
          unsupportedFile,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('8. should reject registration when CAPTCHA is missing', async () => {
      await expect(
        service.register({
          name: 'Ramesh Patel',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Nashik',
          state: 'Maharashtra',
          latitude: 20.1704,
          longitude: 73.9877,
          profilePhotoUrl: '/api/uploads/profile-photos/photo-1.jpg',
          captchaId: '',
          captchaAnswer: '',
        }),
      ).rejects.toThrow('Please enter the CAPTCHA.');
    });

    it('9. should reject registration when CAPTCHA is incorrect', async () => {
      await expect(
        service.register({
          name: 'Ramesh Patel',
          email: 'ramesh@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          district: 'Nashik',
          state: 'Maharashtra',
          latitude: 20.1704,
          longitude: 73.9877,
          profilePhotoUrl: '/api/uploads/profile-photos/photo-1.jpg',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'WRONG_ANSWER',
        }),
      ).rejects.toThrow('Incorrect CAPTCHA. Please try again.');
    });
  });

  describe('login', () => {
    it('1. should block login if user approvalStatus is PENDING', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'farmer-pending-1',
        phone: '9876543210',
        passwordHash: await bcrypt.hash('Farmer@123', 10),
        role: Role.FARMER,
        approvalStatus: ApprovalStatus.PENDING,
        verificationStatus: VerificationStatus.PENDING,
      });

      await expect(
        service.login({
          identifier: '9876543210',
          password: 'Farmer@123',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow('Your registration is awaiting admin approval');
    });

    it('2. should block login if user approvalStatus is REJECTED', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'farmer-rejected-1',
        phone: '9876543210',
        passwordHash: await bcrypt.hash('Farmer@123', 10),
        role: Role.FARMER,
        approvalStatus: ApprovalStatus.REJECTED,
        rejectionReason: 'Land title invalid',
      });

      await expect(
        service.login({
          identifier: '9876543210',
          password: 'Farmer@123',
          captchaId: 'valid-captcha-id',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow('Your registration was not approved. Reason: Land title invalid');
    });

    it('3. should successfully log in an APPROVED user and issue JWT', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'usr-farmer-1',
        name: 'Ramesh Patel',
        phone: '9876543210',
        passwordHash: await bcrypt.hash('Farmer@123', 10),
        role: Role.FARMER,
        approvalStatus: ApprovalStatus.APPROVED,
        verificationStatus: VerificationStatus.VERIFIED,
        isVerified: true,
      });

      const res = await service.login({
        identifier: '9876543210',
        password: 'Farmer@123',
        captchaId: 'valid-captcha-id',
        captchaAnswer: 'K7P4X',
      });

      expect(res).toHaveProperty('accessToken');
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.APPROVED);
    });
  });
});
