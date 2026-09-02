import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FALLBACK_LOTS } from '../lots/lots.service';
import { FALLBACK_BIDS, FALLBACK_TRANSACTIONS, FALLBACK_PAYMENTS } from '../bids/bids.service';
import {
  FALLBACK_USERS,
  getAllInMemoryUsers,
  findInMemoryUserById,
  updateInMemoryUser,
} from '../auth/fallback-users';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CropLotStatus,
  BidStatus,
  TransactionStatus,
  PaymentStatus,
  Role,
  ApprovalStatus,
  VerificationStatus,
  AuditAction,
} from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  private getFallbackDashboardStats(recentActivity: any[] = []) {
    const allUsers = getAllInMemoryUsers();
    const farmers = allUsers.filter((u) => u.role === Role.FARMER);
    const buyers = allUsers.filter((u) => u.role === Role.BUYER);
    const pendingFarmers = allUsers.filter(
      (u) => u.role === Role.FARMER && u.approvalStatus === ApprovalStatus.PENDING,
    ).length;
    const pendingBuyers = allUsers.filter(
      (u) => u.role === Role.BUYER && u.approvalStatus === ApprovalStatus.PENDING,
    ).length;
    const approvedFarmers = allUsers.filter(
      (u) => u.role === Role.FARMER && u.approvalStatus === ApprovalStatus.APPROVED,
    ).length;
    const approvedBuyers = allUsers.filter(
      (u) => u.role === Role.BUYER && u.approvalStatus === ApprovalStatus.APPROVED,
    ).length;

    const activeLots = FALLBACK_LOTS.filter(
      (l) => l.status === CropLotStatus.OPEN || l.status === CropLotStatus.BIDDING,
    ).length;
    const activeBiddingLots = FALLBACK_LOTS.filter(
      (l) => l.status === CropLotStatus.BIDDING,
    ).length;
    const soldLots = FALLBACK_LOTS.filter((l) => l.status === CropLotStatus.SOLD).length;
    const cancelledLots = FALLBACK_LOTS.filter((l) => l.status === CropLotStatus.CANCELLED).length;

    const pendingBids = FALLBACK_BIDS.filter((b) => b.status === BidStatus.PENDING).length;
    const acceptedBids = FALLBACK_BIDS.filter((b) => b.status === BidStatus.ACCEPTED).length;
    const cancelledBids = FALLBACK_BIDS.filter((b) => b.status === BidStatus.WITHDRAWN).length;
    const modifiedBids = 0;

    const totalTransactionValue =
      FALLBACK_TRANSACTIONS.reduce((acc, t) => acc + (t.totalAmount || 0), 0) +
      (soldLots > 0 ? 174000 : 0);
    const completedPaymentsValue =
      FALLBACK_PAYMENTS.filter((p) => p.status === PaymentStatus.PAID).reduce(
        (acc, p) => acc + (p.amount || 0),
        0,
      ) + (soldLots > 0 ? 174000 : 0);
    const pendingPaymentsValue = FALLBACK_PAYMENTS.filter(
      (p) => p.status === PaymentStatus.PENDING,
    ).reduce((acc, p) => acc + (p.amount || 0), 0);

    return {
      totalFarmers: farmers.length,
      totalBuyers: buyers.length,
      pendingFarmers,
      pendingBuyers,
      pendingRegistrations: pendingFarmers + pendingBuyers,
      approvedFarmers,
      approvedBuyers,
      approvedAccounts: approvedFarmers + approvedBuyers,
      activeLots,
      activeBiddingLots,
      soldLots,
      cancelledLots,
      pendingBids,
      acceptedBids,
      cancelledBids,
      modifiedBids,
      totalTransactionValue,
      pendingPaymentsValue,
      completedPaymentsValue,
      recentActivity,
    };
  }

  async getDashboardStats() {
    let recentActivity: any[] = [];
    try {
      recentActivity = await this.auditService.getRecent(10);
    } catch {
      recentActivity = [];
    }

    if (!this.prisma.isConnected) {
      return this.getFallbackDashboardStats(recentActivity);
    }

    try {
      const [
        totalFarmers,
        totalBuyers,
        pendingFarmers,
        pendingBuyers,
        approvedFarmers,
        approvedBuyers,
        activeLots,
        activeBiddingLots,
        soldLots,
        cancelledLots,
        pendingBids,
        acceptedBids,
        cancelledBids,
        transactions,
        payments,
      ] = await Promise.all([
        this.prisma.user.count({ where: { role: Role.FARMER } }),
        this.prisma.user.count({ where: { role: Role.BUYER } }),
        this.prisma.user.count({
          where: { role: Role.FARMER, approvalStatus: ApprovalStatus.PENDING },
        }),
        this.prisma.user.count({
          where: { role: Role.BUYER, approvalStatus: ApprovalStatus.PENDING },
        }),
        this.prisma.user.count({
          where: { role: Role.FARMER, approvalStatus: ApprovalStatus.APPROVED },
        }),
        this.prisma.user.count({
          where: { role: Role.BUYER, approvalStatus: ApprovalStatus.APPROVED },
        }),
        this.prisma.cropLot.count({
          where: { status: { in: [CropLotStatus.OPEN, CropLotStatus.BIDDING] } },
        }),
        this.prisma.cropLot.count({ where: { status: CropLotStatus.BIDDING } }),
        this.prisma.cropLot.count({ where: { status: CropLotStatus.SOLD } }),
        this.prisma.cropLot.count({ where: { status: CropLotStatus.CANCELLED } }),
        this.prisma.bid.count({ where: { status: BidStatus.PENDING } }),
        this.prisma.bid.count({ where: { status: BidStatus.ACCEPTED } }),
        this.prisma.bid.count({ where: { status: BidStatus.WITHDRAWN } }),
        this.prisma.transaction.findMany({ select: { totalAmount: true } }),
        this.prisma.payment.findMany({ select: { amount: true, status: true } }),
      ]);

      const modifiedBids = await this.prisma.auditLog.count({
        where: { action: AuditAction.QUANTITY_MODIFIED },
      });

      const totalTransactionValue = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
      const completedPaymentsValue = payments
        .filter((p) => p.status === PaymentStatus.PAID)
        .reduce((acc, p) => acc + p.amount, 0);
      const pendingPaymentsValue = payments
        .filter((p) => p.status === PaymentStatus.PENDING)
        .reduce((acc, p) => acc + p.amount, 0);

      return {
        totalFarmers,
        totalBuyers,
        pendingFarmers,
        pendingBuyers,
        pendingRegistrations: pendingFarmers + pendingBuyers,
        approvedFarmers,
        approvedBuyers,
        approvedAccounts: approvedFarmers + approvedBuyers,
        activeLots,
        activeBiddingLots,
        soldLots,
        cancelledLots,
        pendingBids,
        acceptedBids,
        cancelledBids,
        modifiedBids,
        totalTransactionValue,
        pendingPaymentsValue,
        completedPaymentsValue,
        recentActivity,
      };
    } catch (err) {
      return this.getFallbackDashboardStats(recentActivity);
    }
  }

  private getFallbackRegistrations(query: any = {}) {
    const { role, status, search, state, sortBy } = query;
    let users = getAllInMemoryUsers().filter(
      (u) => u.role === Role.FARMER || u.role === Role.BUYER,
    );

    if (role && role !== 'ALL') {
      users = users.filter((u) => u.role === role);
    }
    if (status && status !== 'ALL') {
      users = users.filter((u) => u.approvalStatus === status);
    }
    if (state && state !== 'ALL') {
      users = users.filter((u) => u.state?.toLowerCase() === state.toLowerCase());
    }
    if (search && search.trim()) {
      const q = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.includes(q) ||
          u.district?.toLowerCase().includes(q) ||
          u.organizationName?.toLowerCase().includes(q) ||
          u.state?.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'oldest') {
      users.sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
    } else {
      users.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    }

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      district: u.district,
      state: u.state,
      village: u.village,
      location: u.location,
      latitude: u.latitude,
      longitude: u.longitude,
      profilePhotoUrl: u.profilePhotoUrl,
      approvalStatus: u.approvalStatus,
      verificationStatus: u.verificationStatus,
      isVerified: u.isVerified,
      rejectionReason: u.rejectionReason,
      approvedBy: u.approvedBy,
      approvedAt: u.approvedAt,
      primaryCrop: u.primaryCrop,
      farmSize: u.farmSize,
      kccNumber: u.kccNumber,
      apmcNumber: u.apmcNumber,
      organizationName: u.organizationName,
      contactPerson: u.contactPerson,
      businessType: u.businessType,
      gstin: u.gstin,
      fssaiNumber: u.fssaiNumber,
      warehouseLocation: u.warehouseLocation,
      createdAt: u.createdAt || new Date(),
    }));
  }

  async getRegistrations(query: any = {}) {
    const { role, status, search, state, sortBy } = query;

    if (!this.prisma.isConnected) {
      return this.getFallbackRegistrations(query);
    }

    try {
      const where: any = {
        role: { in: [Role.FARMER, Role.BUYER] },
      };

      if (role && role !== 'ALL') where.role = role;
      if (status && status !== 'ALL') where.approvalStatus = status;
      if (state && state !== 'ALL') where.state = { equals: state, mode: 'insensitive' };
      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
          { district: { contains: q, mode: 'insensitive' } },
          { organizationName: { contains: q, mode: 'insensitive' } },
          { state: { contains: q, mode: 'insensitive' } },
        ];
      }

      const orderBy: any =
        sortBy === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };

      const users = await this.prisma.user.findMany({
        where,
        orderBy,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          district: true,
          state: true,
          village: true,
          location: true,
          latitude: true,
          longitude: true,
          profilePhotoUrl: true,
          approvalStatus: true,
          verificationStatus: true,
          isVerified: true,
          rejectionReason: true,
          approvedBy: true,
          approvedAt: true,
          primaryCrop: true,
          farmSize: true,
          kccNumber: true,
          apmcNumber: true,
          organizationName: true,
          contactPerson: true,
          businessType: true,
          gstin: true,
          fssaiNumber: true,
          warehouseLocation: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return users;
    } catch (err) {
      return this.getFallbackRegistrations(query);
    }
  }

  async getRegistrationById(id: string) {
    if (!this.prisma.isConnected) {
      const user = findInMemoryUserById(id);
      if (!user) throw new NotFoundException('Registration record not found.');
      return user;
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          role: true,
          district: true,
          state: true,
          village: true,
          location: true,
          latitude: true,
          longitude: true,
          profilePhotoUrl: true,
          approvalStatus: true,
          verificationStatus: true,
          isVerified: true,
          rejectionReason: true,
          approvedBy: true,
          approvedAt: true,
          primaryCrop: true,
          farmSize: true,
          kccNumber: true,
          apmcNumber: true,
          organizationName: true,
          contactPerson: true,
          businessType: true,
          gstin: true,
          fssaiNumber: true,
          warehouseLocation: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        // Check in-memory fallback
        const inMem = findInMemoryUserById(id);
        if (!inMem) throw new NotFoundException('Registration record not found.');
        return inMem;
      }

      return user;
    } catch (err) {
      const inMem = findInMemoryUserById(id);
      if (!inMem) throw new NotFoundException('Registration record not found.');
      return inMem;
    }
  }

  async approveUser(targetUserId: string, adminUser: any) {
    let updatedUser: any;

    if (this.prisma.isConnected) {
      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        const inMem = findInMemoryUserById(targetUserId);
        if (!inMem) throw new NotFoundException('User not found.');
      } else {
        updatedUser = await this.prisma.user.update({
          where: { id: targetUserId },
          data: {
            approvalStatus: ApprovalStatus.APPROVED,
            verificationStatus: VerificationStatus.VERIFIED,
            isVerified: true,
            approvedBy: adminUser.name || adminUser.email || 'Vanijya Admin',
            approvedAt: new Date(),
            rejectionReason: null,
          },
        });
      }
    }

    // Always keep in-memory synchronized
    const inMemUpdated = updateInMemoryUser(targetUserId, {
      approvalStatus: ApprovalStatus.APPROVED,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
      approvedBy: adminUser.name || 'Vanijya Admin',
      approvedAt: new Date(),
      rejectionReason: undefined,
    });

    if (!updatedUser) {
      if (!inMemUpdated) throw new NotFoundException('User not found.');
      updatedUser = inMemUpdated;
    }

    // Audit Log
    await this.auditService.log({
      actorId: adminUser.id || 'usr-admin-1',
      targetUserId,
      action: AuditAction.REGISTRATION_APPROVED,
      metadata: {
        targetName: updatedUser.name,
        targetRole: updatedUser.role,
        approvedBy: adminUser.name || 'Vanijya Admin',
      },
    });

    // Notify User
    await this.notificationsService.create({
      userId: targetUserId,
      title: 'Account Approved',
      message: 'Your Vanijya account has been approved by the administrator. You can now access all portal features.',
      type: 'APPROVAL',
    });

    return {
      message: `User ${updatedUser.name} (${updatedUser.role}) has been successfully approved.`,
      user: updatedUser,
    };
  }

  async rejectUser(targetUserId: string, rejectionReason: string, adminUser: any) {
    if (!rejectionReason || rejectionReason.trim() === '') {
      throw new BadRequestException('A reason is required to reject a registration.');
    }

    let updatedUser: any;

    if (this.prisma.isConnected) {
      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) {
        const inMem = findInMemoryUserById(targetUserId);
        if (!inMem) throw new NotFoundException('User not found.');
      } else {
        updatedUser = await this.prisma.user.update({
          where: { id: targetUserId },
          data: {
            approvalStatus: ApprovalStatus.REJECTED,
            verificationStatus: VerificationStatus.REJECTED,
            isVerified: false,
            rejectionReason: rejectionReason.trim(),
            approvedBy: adminUser.name || adminUser.email || 'Vanijya Admin',
            approvedAt: new Date(),
          },
        });
      }
    }

    // Always keep in-memory synchronized
    const inMemUpdated = updateInMemoryUser(targetUserId, {
      approvalStatus: ApprovalStatus.REJECTED,
      verificationStatus: VerificationStatus.REJECTED,
      isVerified: false,
      rejectionReason: rejectionReason.trim(),
      approvedBy: adminUser.name || 'Vanijya Admin',
      approvedAt: new Date(),
    });

    if (!updatedUser) {
      if (!inMemUpdated) throw new NotFoundException('User not found.');
      updatedUser = inMemUpdated;
    }

    // Audit Log
    await this.auditService.log({
      actorId: adminUser.id || 'usr-admin-1',
      targetUserId,
      action: AuditAction.REGISTRATION_REJECTED,
      metadata: {
        targetName: updatedUser.name,
        targetRole: updatedUser.role,
        rejectionReason: rejectionReason.trim(),
        rejectedBy: adminUser.name || 'Vanijya Admin',
      },
    });

    // Notify User
    await this.notificationsService.create({
      userId: targetUserId,
      title: 'Registration Rejected',
      message: `Your Vanijya registration was not approved. Reason: ${rejectionReason.trim()}`,
      type: 'REJECTION',
    });

    return {
      message: `User ${updatedUser.name} (${updatedUser.role}) has been rejected.`,
      user: updatedUser,
    };
  }

  // Monitor Crop Lots
  async getAllLots(query: any = {}) {
    if (!this.prisma.isConnected) {
      return FALLBACK_LOTS;
    }
    const where: any = {};
    if (query.cropId) where.cropId = query.cropId;
    if (query.status) where.status = query.status;
    if (query.farmerId) where.farmerId = query.farmerId;
    return this.prisma.cropLot.findMany({
      where,
      include: {
        crop: true,
        farmer: {
          select: {
            id: true,
            name: true,
            phone: true,
            district: true,
            state: true,
            approvalStatus: true,
          },
        },
        bids: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Monitor Transactions
  async getAllTransactions() {
    if (!this.prisma.isConnected) {
      return FALLBACK_TRANSACTIONS;
    }
    return this.prisma.transaction.findMany({
      include: {
        lot: { include: { crop: true } },
        acceptedBid: { include: { buyer: true } },
        buyer: true,
        farmer: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Global Platform User Management
  async getAllUsers(role?: Role) {
    if (!this.prisma.isConnected) {
      let users = getAllInMemoryUsers();
      if (role) users = users.filter((u) => u.role === role);
      return users;
    }
    const where: any = role ? { role } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        district: true,
        state: true,
        approvalStatus: true,
        verificationStatus: true,
        isVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllBids(query: any = {}) {
    if (!this.prisma.isConnected) {
      return FALLBACK_BIDS;
    }
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.lotId) where.lotId = query.lotId;
    if (query.buyerId) where.buyerId = query.buyerId;
    return this.prisma.bid.findMany({
      where,
      include: {
        buyer: { select: { id: true, name: true, organizationName: true, phone: true } },
        lot: { include: { crop: true, farmer: { select: { id: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUsers() {
    const farmers = await this.getAllUsers(Role.FARMER);
    const buyers = await this.getAllUsers(Role.BUYER);
    return { farmers, buyers };
  }

  async getActivityFeed(limit = 50) {
    return this.auditService.getRecent(limit);
  }
}
