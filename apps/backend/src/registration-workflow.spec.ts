import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth/auth.service';
import { AdminService } from './admin/admin.service';
import { UsersService } from './users/users.service';
import { UploadsService } from './uploads/uploads.service';
import { NotificationsService } from './notifications/notifications.service';
import { AuditService } from './audit/audit.service';
import { PrismaService } from './prisma/prisma.service';
import { CaptchaService } from './auth/captcha.service';
import { JwtService } from '@nestjs/jwt';
import { Role, ApprovalStatus, VerificationStatus, AuditAction, QualityGrade, CropLotStatus } from '@prisma/client';
import { BadRequestException, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { LotsService } from './lots/lots.service';

describe('Comprehensive Farmer & Buyer Registration & Admin Approval Suite (27+ Scenarios)', () => {
  let authService: AuthService;
  let adminService: AdminService;
  let usersService: UsersService;
  let uploadsService: UploadsService;
  let notificationsService: NotificationsService;
  let auditService: AuditService;
  let lotsService: LotsService;

  // In-memory test store
  const mockDbUsers: any[] = [];
  const mockDbAudit: any[] = [];
  const mockDbNotifs: any[] = [];

  const mockPrisma = {
    isConnected: true,
    user: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.id) return mockDbUsers.find((u) => u.id === where.id) || null;
        if (where.phone) return mockDbUsers.find((u) => u.phone === where.phone) || null;
        if (where.email) return mockDbUsers.find((u) => u.email === where.email) || null;
        return null;
      }),
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where.OR) {
          return mockDbUsers.find((u) =>
            where.OR.some((cond: any) => (cond.phone && u.phone === cond.phone) || (cond.email && u.email === cond.email)),
          ) || null;
        }
        return null;
      }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        let list = [...mockDbUsers];
        if (where?.role) {
          if (where.role.in && Array.isArray(where.role.in)) {
            list = list.filter((u) => where.role.in.includes(u.role));
          } else {
            list = list.filter((u) => u.role === where.role);
          }
        }
        if (where?.approvalStatus) {
          list = list.filter((u) => u.approvalStatus === where.approvalStatus);
        }
        return list;
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        const item = {
          id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockDbUsers.push(item);
        return item;
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const item = mockDbUsers.find((u) => u.id === where.id);
        if (!item) throw new NotFoundException('User not found');
        Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      count: jest.fn().mockImplementation(({ where }) => {
        let list = [...mockDbUsers];
        if (where?.role) list = list.filter((u) => u.role === where.role);
        if (where?.approvalStatus) list = list.filter((u) => u.approvalStatus === where.approvalStatus);
        return list.length;
      }),
    },
    auditLog: {
      create: jest.fn().mockImplementation(({ data }) => {
        const log = { id: `audit-${Date.now()}`, ...data, createdAt: new Date() };
        mockDbAudit.push(log);
        return log;
      }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    notification: {
      create: jest.fn().mockImplementation(({ data }) => {
        const n = { id: `notif-${Date.now()}`, ...data, createdAt: new Date() };
        mockDbNotifs.push(n);
        return n;
      }),
      createMany: jest.fn().mockResolvedValue({ count: 1 }),
      findMany: jest.fn().mockImplementation(({ where }) => {
        return mockDbNotifs.filter((n) => n.userId === where.userId);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        const n = mockDbNotifs.find((item) => item.id === where.id);
        if (n) Object.assign(n, data);
        return n;
      }),
    },
    cropLot: { count: jest.fn().mockResolvedValue(3), findMany: jest.fn().mockResolvedValue([]) },
    bid: { count: jest.fn().mockResolvedValue(2), findMany: jest.fn().mockResolvedValue([]) },
    transaction: { findMany: jest.fn().mockResolvedValue([]) },
    payment: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeAll(async () => {
    // Seed initial admin in mock DB
    const adminHash = await bcrypt.hash('Admin@123', 10);
    mockDbUsers.push({
      id: 'usr-admin-1',
      name: 'System Admin',
      email: 'admin@vanijya.gov.in',
      phone: '9876543290',
      passwordHash: adminHash,
      role: Role.ADMIN,
      approvalStatus: ApprovalStatus.APPROVED,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      state: 'Delhi',
      district: 'Central Delhi',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AdminService,
        UsersService,
        UploadsService,
        NotificationsService,
        AuditService,
        LotsService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('mock-jwt-token') },
        },
        {
          provide: CaptchaService,
          useValue: {
            verifyCaptcha: jest.fn().mockReturnValue({ success: true }),
            generateCaptcha: jest.fn().mockReturnValue({ captchaId: 'cid', svgImage: 'svg' }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    adminService = module.get<AdminService>(AdminService);
    usersService = module.get<UsersService>(UsersService);
    uploadsService = module.get<UploadsService>(UploadsService);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    auditService = module.get<AuditService>(AuditService);
    lotsService = module.get<LotsService>(LotsService);
  });

  describe('PART 1: SIGNUP & REGISTRATION VALIDATION', () => {
    let createdFarmerId: string;
    let createdBuyerId: string;

    it('1. Farmer registration works successfully', async () => {
      const res = await authService.register({
        name: 'Suresh Kumar',
        phone: '9876543100',
        email: 'suresh@farmer.in',
        password: 'Password@123',
        role: Role.FARMER,
        state: 'Andhra Pradesh',
        district: 'Guntur',
        village: 'Tenali',
        latitude: 16.2437,
        longitude: 80.64,
        profilePhotoUrl: '/api/uploads/profile-photos/suresh.jpg',
        primaryCrop: 'Chilli',
        farmSize: 5.5,
        kccNumber: 'KCC-AP-2024-001',
      });

      expect(res.message).toContain('submitted successfully');
      expect(res.user.role).toEqual(Role.FARMER);
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
      expect(res.user.primaryCrop).toEqual('Chilli');
      createdFarmerId = res.user.id;
    });

    it('2. Buyer registration works successfully', async () => {
      const res = await authService.register({
        name: 'AgroProcure Private Limited',
        phone: '9876543101',
        email: 'procure@agroprocure.com',
        password: 'Password@123',
        role: Role.BUYER,
        state: 'Telangana',
        district: 'Hyderabad',
        location: 'Banjara Hills, Hyderabad',
        latitude: 17.4126,
        longitude: 78.4487,
        profilePhotoUrl: '/api/uploads/profile-photos/buyer1.jpg',
        organizationName: 'AgroProcure Pvt Ltd',
        contactPerson: 'Kalyan Rao',
        businessType: 'WHOLESALER',
        gstin: '36AABCA1234A1Z5',
        fssaiNumber: '13621018000111',
      });

      expect(res.message).toContain('submitted successfully');
      expect(res.user.role).toEqual(Role.BUYER);
      expect(res.user.organizationName).toEqual('AgroProcure Pvt Ltd');
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
      createdBuyerId = res.user.id;
    });

    it('3. Admin registration fails (Public registration blocked)', async () => {
      await expect(
        authService.register({
          name: 'Hacker Admin',
          email: 'hacker@admin.com',
          password: 'Password@123',
          role: Role.ADMIN,
          state: 'Delhi',
          district: 'New Delhi',
          latitude: 28.61,
          longitude: 77.2,
          profilePhotoUrl: '/api/uploads/profile-photos/hacker.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('4. Duplicate mobile number fails with friendly message', async () => {
      await expect(
        authService.register({
          name: 'Duplicate Suresh',
          phone: '9876543100', // existing phone
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Andhra Pradesh',
          district: 'Guntur',
          latitude: 16.2437,
          longitude: 80.64,
          profilePhotoUrl: '/api/uploads/profile-photos/photo.jpg',
        }),
      ).rejects.toThrow('An account with this mobile number already exists.');
    });

    it('5. Duplicate email fails with friendly message', async () => {
      await expect(
        authService.register({
          name: 'Duplicate Buyer',
          phone: '9876543199',
          email: 'procure@agroprocure.com', // existing email
          password: 'Password@123',
          role: Role.BUYER,
          state: 'Telangana',
          district: 'Hyderabad',
          latitude: 17.41,
          longitude: 78.44,
          profilePhotoUrl: '/api/uploads/profile-photos/photo.jpg',
        }),
      ).rejects.toThrow('An account with this email already exists.');
    });

    it('6. Invalid state fails validation', async () => {
      await expect(
        authService.register({
          name: 'Farmer Test',
          phone: '9876543105',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'NonExistentState',
          district: 'Guntur',
          latitude: 16.24,
          longitude: 80.64,
          profilePhotoUrl: '/api/uploads/profile-photos/photo.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('7. Invalid district / state combination fails validation', async () => {
      await expect(
        authService.register({
          name: 'Farmer Test',
          phone: '9876543106',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Maharashtra', // Maharashtra state
          district: 'Guntur', // Andhra Pradesh district
          latitude: 16.24,
          longitude: 80.64,
          profilePhotoUrl: '/api/uploads/profile-photos/photo.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('8. Missing photo URL fails validation', async () => {
      await expect(
        authService.register({
          name: 'Farmer Test',
          phone: '9876543107',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Andhra Pradesh',
          district: 'Guntur',
          latitude: 16.24,
          longitude: 80.64,
          profilePhotoUrl: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('9. Missing location coordinates fail validation', async () => {
      await expect(
        authService.register({
          name: 'Farmer Test',
          phone: '9876543108',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Andhra Pradesh',
          district: 'Guntur',
          latitude: undefined as any,
          longitude: undefined as any,
          profilePhotoUrl: '/api/uploads/profile-photos/photo.jpg',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('10. Invalid photo format is rejected by upload service', async () => {
      await expect(
        uploadsService.saveBase64Image('data:application/pdf;base64,JVBERi0xLjQK...'),
      ).rejects.toThrow('Invalid image format');
    });
  });

  describe('PART 2: APPROVAL & LOGIN RESTRICTIONS', () => {
    let pendingFarmer: any;

    beforeAll(() => {
      pendingFarmer = mockDbUsers.find((u) => u.phone === '9876543100');
    });

    it('11. New user has approvalStatus = PENDING and isVerified = false', () => {
      expect(pendingFarmer.approvalStatus).toEqual(ApprovalStatus.PENDING);
      expect(pendingFarmer.verificationStatus).toEqual(VerificationStatus.PENDING);
      expect(pendingFarmer.isVerified).toBe(false);
    });

    it('12. Pending user cannot log in and receives awaiting approval message', async () => {
      await expect(
        authService.login({
          identifier: '9876543100',
          password: 'Password@123',
          captchaId: 'cid',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow('Your registration is awaiting admin approval.');
    });

    it('13. Admin can view pending registrations with filters', async () => {
      const registrations = await adminService.getRegistrations({
        status: ApprovalStatus.PENDING,
      });

      expect(registrations.length).toBeGreaterThanOrEqual(1);
      const found = registrations.find((r) => r.id === pendingFarmer.id);
      expect(found).toBeDefined();
      expect(found.name).toEqual('Suresh Kumar');
    });

    it('14. Admin can approve a pending registration', async () => {
      const approveRes = await adminService.approveUser(pendingFarmer.id, {
        id: 'usr-admin-1',
        name: 'System Admin',
      });

      expect(approveRes.message).toContain('successfully approved');
      expect(approveRes.user.approvalStatus).toEqual(ApprovalStatus.APPROVED);
      expect(approveRes.user.verificationStatus).toEqual(VerificationStatus.VERIFIED);
      expect(approveRes.user.isVerified).toBe(true);
      expect(approveRes.user.approvedBy).toEqual('System Admin');
    });

    it('15. Approved user can now log in successfully and receives JWT', async () => {
      const loginRes = await authService.login({
        identifier: '9876543100',
        password: 'Password@123',
        captchaId: 'cid',
        captchaAnswer: 'K7P4X',
      });

      expect(loginRes).toHaveProperty('accessToken');
      expect(loginRes.user.name).toEqual('Suresh Kumar');
      expect(loginRes.user.approvalStatus).toEqual(ApprovalStatus.APPROVED);
    });

    it('16. Admin can reject another applicant with a reason', async () => {
      const buyer = mockDbUsers.find((u) => u.phone === '9876543101');
      const rejectRes = await adminService.rejectUser(
        buyer.id,
        'Invalid GSTIN and FSSAI credentials provided.',
        { id: 'usr-admin-1', name: 'System Admin' },
      );

      expect(rejectRes.message).toContain('rejected');
      expect(rejectRes.user.approvalStatus).toEqual(ApprovalStatus.REJECTED);
      expect(rejectRes.user.rejectionReason).toEqual(
        'Invalid GSTIN and FSSAI credentials provided.',
      );
    });

    it('17. Rejected user cannot log in and receives rejection message with reason', async () => {
      await expect(
        authService.login({
          identifier: '9876543101',
          password: 'Password@123',
          captchaId: 'cid',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow(
        'Your registration was not approved. Reason: Invalid GSTIN and FSSAI credentials provided.',
      );
    });

    it('18. Rejection reason is persisted in PostgreSQL/database model', async () => {
      const buyer = mockDbUsers.find((u) => u.phone === '9876543101');
      const retrieved = await usersService.getProfile(buyer.id);
      expect(retrieved.rejectionReason).toEqual(
        'Invalid GSTIN and FSSAI credentials provided.',
      );
    });
  });

  describe('PART 3: PHOTO, LOCATION PRIVACY & PROFILE COMPLETION', () => {
    it('19. Photo upload persists and returns accessible URL path', async () => {
      // 1x1 transparent PNG base64
      const sampleBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const uploaded = await uploadsService.saveBase64Image(sampleBase64);
      expect(uploaded.url).toContain('/api/uploads/profile-photos/photo-');
      expect(uploadsService.getFilePath(uploaded.filename)).not.toBeNull();
    });

    it('20. Public profile API masks exact GPS coordinates for farmer privacy', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543100');
      const publicProf = await usersService.getPublicProfile(farmer.id);

      expect(publicProf.name).toEqual('Suresh Kumar');
      expect(publicProf.state).toEqual('Andhra Pradesh');
      expect(publicProf.district).toEqual('Guntur');
      // Verify exact latitude and longitude are NOT exposed in public profile DTO
      expect((publicProf as any).latitude).toBeUndefined();
      expect((publicProf as any).longitude).toBeUndefined();
      expect((publicProf as any).passwordHash).toBeUndefined();
    });

    it('21. Private /me API returns full profile with coordinates for self & admin', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543100');
      const privateProf = await usersService.getProfile(farmer.id);

      expect(privateProf.latitude).toEqual(16.2437);
      expect(privateProf.longitude).toEqual(80.64);
      expect(privateProf.primaryCrop).toEqual('Chilli');
    });

    it('22. Profile completion percentage is calculated dynamically', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543100');
      const completion = await usersService.getProfileCompletion(farmer.id);

      expect(completion.percentage).toBeGreaterThan(70);
      expect(completion.completedFields).toContain('Full Legal Name');
      expect(completion.completedFields).toContain('Profile Photo');
    });

    it('23. Updating profile triggers audit logging', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543100');
      await usersService.updateProfile(farmer.id, {
        village: 'Tenali Rural',
      });

      const updated = await usersService.getProfile(farmer.id);
      expect(updated.village).toEqual('Tenali Rural');
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('PART 4: ADMIN DASHBOARD METRICS & NOTIFICATIONS', () => {
    it('24. Admin dashboard stats includes pending registrations count', async () => {
      const stats = await adminService.getDashboardStats();
      expect(stats).toHaveProperty('pendingFarmers');
      expect(stats).toHaveProperty('pendingBuyers');
      expect(stats).toHaveProperty('pendingRegistrations');
    });

    it('25. Notifications are created for user and admin events', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543100');
      const notifs = await notificationsService.getUserNotifications(farmer.id);
      expect(notifs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('PART 5: MULTIPART REGISTRATION, 5MB LIMIT & MIME VALIDATION', () => {
    it('26. Farmer registration succeeds with binary JPG file', async () => {
      const jpgFile = {
        buffer: Buffer.from('mock-binary-jpg-data'),
        mimetype: 'image/jpeg',
        size: 1024 * 300,
        originalname: 'profile.jpg',
      };

      const res = await authService.register(
        {
          name: 'Suresh Kumar Multipart',
          phone: '9876543181',
          email: 'suresh-multipart@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Maharashtra',
          district: 'Nashik',
          latitude: 20.0,
          longitude: 73.8,
        },
        jpgFile,
      );

      expect(res.user.profilePhotoUrl).toContain('/api/uploads/profile-photos/photo-');
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
    });

    it('27. Farmer registration succeeds with binary PNG file', async () => {
      const pngFile = {
        buffer: Buffer.from('mock-binary-png-data'),
        mimetype: 'image/png',
        size: 1024 * 400,
        originalname: 'profile.png',
      };

      const res = await authService.register(
        {
          name: 'Prakash Rao Multipart',
          phone: '9876543182',
          email: 'prakash-multipart@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Andhra Pradesh',
          district: 'Guntur',
          latitude: 16.3,
          longitude: 80.4,
        },
        pngFile,
      );

      expect(res.user.profilePhotoUrl).toContain('.png');
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
    });

    it('28. Buyer registration succeeds with binary WebP file', async () => {
      const webpFile = {
        buffer: Buffer.from('mock-binary-webp-data'),
        mimetype: 'image/webp',
        size: 1024 * 200,
        originalname: 'buyer-logo.webp',
      };

      const res = await authService.register(
        {
          name: 'MegaMart Retail Ltd',
          organizationName: 'MegaMart Retail Ltd',
          contactPerson: 'Deepak Verma',
          phone: '9876543183',
          email: 'deepak-multipart@megamart.in',
          password: 'Password@123',
          role: Role.BUYER,
          state: 'Delhi',
          district: 'New Delhi',
          latitude: 28.6,
          longitude: 77.2,
        },
        webpFile,
      );

      expect(res.user.profilePhotoUrl).toContain('.webp');
      expect(res.user.approvalStatus).toEqual(ApprovalStatus.PENDING);
    });

    it('29. Rejects registration when binary file exceeds 5MB limit', async () => {
      const oversizedFile = {
        buffer: Buffer.from('large-image-content-over-5mb'),
        mimetype: 'image/jpeg',
        size: 6 * 1024 * 1024,
        originalname: 'huge.jpg',
      };

      await expect(
        authService.register(
          {
            name: 'Oversized User',
            phone: '9876543193',
            password: 'Password@123',
            role: Role.FARMER,
            state: 'Maharashtra',
            district: 'Nashik',
            latitude: 20.0,
            longitude: 73.8,
          },
          oversizedFile,
        ),
      ).rejects.toThrow('Profile photo exceeds the 5 MB size limit');
    });

    it('30. Rejects registration when binary file is unsupported format', async () => {
      const badFile = {
        buffer: Buffer.from('script-executable'),
        mimetype: 'application/pdf',
        size: 1024,
        originalname: 'document.pdf',
      };

      await expect(
        authService.register(
          {
            name: 'Bad Format User',
            phone: '9876543194',
            password: 'Password@123',
            role: Role.FARMER,
            state: 'Maharashtra',
            district: 'Nashik',
            latitude: 20.0,
            longitude: 73.8,
          },
          badFile,
        ),
      ).rejects.toThrow('Only JPG, PNG, and WebP are allowed');
    });

    it('31. Newly registered user immediately appears in Admin registration queue with PENDING status', async () => {
      const jpgFile = {
        buffer: Buffer.from('photo-bytes'),
        mimetype: 'image/jpeg',
        size: 1024 * 50,
        originalname: 'queue-test.jpg',
      };

      const reg = await authService.register(
        {
          name: 'Anand Shinde Queue Test',
          phone: '9876543171',
          email: 'anand-queue@farmer.in',
          password: 'Password@123',
          role: Role.FARMER,
          state: 'Maharashtra',
          district: 'Nashik',
          latitude: 19.99,
          longitude: 73.78,
          primaryCrop: 'Grapes',
        },
        jpgFile,
      );

      const queue = await adminService.getRegistrations({ status: ApprovalStatus.PENDING });
      const found = queue.find((u) => u.phone === '9876543171');
      expect(found).toBeDefined();
      expect(found?.approvalStatus).toEqual(ApprovalStatus.PENDING);
      expect(found?.verificationStatus).toEqual(VerificationStatus.PENDING);
      expect(found?.name).toEqual('Anand Shinde Queue Test');
      expect(found?.profilePhotoUrl).toBeDefined();
    });

    it('32. Admin approval updates status, removes user from PENDING queue, and allows login', async () => {
      const queue = await adminService.getRegistrations({ status: ApprovalStatus.PENDING });
      const applicant = queue.find((u) => u.phone === '9876543171');
      expect(applicant).toBeDefined();

      const adminUser = { id: 'usr-admin-1', name: 'Vanijya System Admin', role: Role.ADMIN };
      const approvalResult = await adminService.approveUser(applicant!.id, adminUser);
      expect(approvalResult.user.approvalStatus).toEqual(ApprovalStatus.APPROVED);
      expect(approvalResult.user.verificationStatus).toEqual(VerificationStatus.VERIFIED);
      expect(approvalResult.user.isVerified).toBe(true);

      // Verify login succeeds now
      const loginRes = await authService.login({
        identifier: '9876543171',
        password: 'Password@123',
        captchaId: 'valid-captcha',
        captchaAnswer: 'K7P4X',
      });
      expect(loginRes).toHaveProperty('accessToken');
      expect(loginRes.user.approvalStatus).toEqual(ApprovalStatus.APPROVED);
    });

    it('33. Admin rejection updates status, records reason, and blocks login with specific reason', async () => {
      const jpgFile = {
        buffer: Buffer.from('photo-bytes'),
        mimetype: 'image/jpeg',
        size: 1024 * 50,
        originalname: 'reject-test.jpg',
      };

      const reg = await authService.register(
        {
          name: 'Incomplete Buyer Profile',
          organizationName: 'Incomplete Buyer Profile',
          contactPerson: 'Rahul Sen',
          phone: '9876543172',
          email: 'rahul-reject@buyer.in',
          password: 'Password@123',
          role: Role.BUYER,
          state: 'Delhi',
          district: 'New Delhi',
          latitude: 28.6,
          longitude: 77.2,
        },
        jpgFile,
      );

      const adminUser = { id: 'usr-admin-1', name: 'Vanijya System Admin', role: Role.ADMIN };
      const rejectResult = await adminService.rejectUser(
        reg.user.id,
        'Invalid GSTIN and trade license missing',
        adminUser,
      );

      expect(rejectResult.user.approvalStatus).toEqual(ApprovalStatus.REJECTED);
      expect(rejectResult.user.rejectionReason).toEqual('Invalid GSTIN and trade license missing');

      // Verify login is blocked
      await expect(
        authService.login({
          identifier: '9876543172',
          password: 'Password@123',
          captchaId: 'valid-captcha',
          captchaAnswer: 'K7P4X',
        }),
      ).rejects.toThrow('Your registration was not approved. Reason: Invalid GSTIN and trade license missing');
    });

    it('34. Approved farmer can publish a crop lot successfully without losing session context', async () => {
      const farmer = mockDbUsers.find((u) => u.phone === '9876543171');
      expect(farmer).toBeDefined();
      expect(farmer.approvalStatus).toEqual(ApprovalStatus.APPROVED);

      const lot = await lotsService.create(farmer.id, {
        cropId: 'crop-1',
        quantity: 100,
        unit: 'QUINTAL',
        expectedPrice: 2400,
        qualityGrade: QualityGrade.GRADE_A,
        location: 'Nashik Grape Farm Gate',
      });

      expect(lot).toBeDefined();
      expect(lot.farmerId).toEqual(farmer.id);
      expect(lot.expectedPrice).toEqual(2400);
      expect(lot.status).toEqual(CropLotStatus.OPEN);
    });

    it('35. Buyer cannot publish a crop lot and receives 403 Forbidden', async () => {
      const buyer = mockDbUsers.find((u) => u.role === Role.BUYER);
      expect(buyer).toBeDefined();

      await expect(
        lotsService.create(buyer.id, {
          cropId: 'crop-1',
          quantity: 100,
          expectedPrice: 2400,
          qualityGrade: QualityGrade.GRADE_A,
          location: 'Azadpur',
        }),
      ).rejects.toThrow('Only approved farmers can publish crop lots');
    });
  });
});
