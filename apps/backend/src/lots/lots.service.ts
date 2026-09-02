import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCropLotDto, UpdateCropLotDto, QueryLotsDto } from './dto/create-lot.dto';
import { CropLotStatus, Role, AuditAction, QualityGrade, ApprovalStatus, VerificationStatus } from '@prisma/client';
import { FALLBACK_CROPS } from '../crops/crops.service';
import { AuditService } from '../audit/audit.service';
import { findInMemoryUserById, getAllInMemoryUsers } from '../auth/fallback-users';

export const FALLBACK_LOTS: any[] = [
  {
    id: 'lot-demo-1',
    farmerId: 'usr-farmer-1',
    cropId: 'crop-1',
    quantity: 100,
    unit: 'QUINTAL',
    expectedPrice: 2200,
    qualityGrade: 'GRADE_A',
    location: 'Village Pimpalgaon, Niphad Taluka, Nashik',
    harvestDate: new Date(),
    status: CropLotStatus.BIDDING,
    createdAt: new Date(Date.now() - 3600000 * 4),
    updatedAt: new Date(),
    crop: { id: 'crop-1', name: 'Tomato', category: 'VEGETABLE', icon: '🍅' },
    farmer: {
      id: 'usr-farmer-1',
      name: 'Ramesh Patel',
      phone: '9876543210',
      district: 'Nashik',
      state: 'Maharashtra',
      isVerified: true,
    },
    bids: [],
    _count: { bids: 1 },
  },
  {
    id: 'lot-demo-2',
    farmerId: 'usr-farmer-1',
    cropId: 'crop-2',
    quantity: 80,
    unit: 'QUINTAL',
    expectedPrice: 1650,
    qualityGrade: 'GRADE_A',
    location: 'Lasalgaon Road, Niphad, Nashik',
    harvestDate: new Date(),
    status: CropLotStatus.OPEN,
    createdAt: new Date(Date.now() - 3600000 * 2),
    updatedAt: new Date(),
    crop: { id: 'crop-2', name: 'Onion', category: 'VEGETABLE', icon: '🧅' },
    farmer: {
      id: 'usr-farmer-1',
      name: 'Ramesh Patel',
      phone: '9876543210',
      district: 'Nashik',
      state: 'Maharashtra',
      isVerified: true,
    },
    bids: [],
    _count: { bids: 0 },
  },
  {
    id: 'lot-demo-3',
    farmerId: 'usr-farmer-2',
    cropId: 'crop-4',
    quantity: 200,
    unit: 'QUINTAL',
    expectedPrice: 2450,
    qualityGrade: 'GRADE_A',
    location: 'Khanna Mandi Gate 2, Ludhiana',
    harvestDate: new Date(),
    status: CropLotStatus.OPEN,
    createdAt: new Date(Date.now() - 3600000 * 5),
    updatedAt: new Date(),
    crop: { id: 'crop-4', name: 'Wheat', category: 'GRAIN', icon: '🌾' },
    farmer: {
      id: 'usr-farmer-2',
      name: 'Gurpreet Singh',
      phone: '9876543211',
      district: 'Ludhiana',
      state: 'Punjab',
      isVerified: true,
    },
    bids: [],
    _count: { bids: 0 },
  },
  {
    id: 'lot-demo-4',
    farmerId: 'usr-farmer-1',
    cropId: 'crop-3',
    quantity: 120,
    unit: 'QUINTAL',
    expectedPrice: 1400,
    qualityGrade: 'GRADE_B',
    location: 'Dindori Road, Nashik',
    harvestDate: new Date(Date.now() - 86400000 * 3),
    status: CropLotStatus.SOLD,
    createdAt: new Date(Date.now() - 86400000 * 3),
    updatedAt: new Date(Date.now() - 86400000 * 2),
    crop: { id: 'crop-3', name: 'Potato', category: 'VEGETABLE', icon: '🥔' },
    farmer: {
      id: 'usr-farmer-1',
      name: 'Ramesh Patel',
      phone: '9876543210',
      district: 'Nashik',
      state: 'Maharashtra',
      isVerified: true,
    },
    bids: [],
    _count: { bids: 1 },
    transaction: {
      id: 'txn-demo-1',
      agreedPrice: 1450,
      quantity: 120,
      totalAmount: 174000,
      status: 'COMPLETED',
      buyer: { name: 'FreshCart Agro Ltd.', district: 'Mumbai' },
      payment: { status: 'PAID', paymentReference: 'UPI-SBI-882199' },
    },
  },
];

@Injectable()
export class LotsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private enrichLot(lot: any) {
    const bids = lot.bids || [];
    const activeBids = bids.filter((b: any) => b.status === 'PENDING');
    const highestBid = bids.length > 0 ? Math.max(...bids.map((b: any) => b.price)) : null;
    const highestActiveBid = activeBids.length > 0 ? Math.max(...activeBids.map((b: any) => b.price)) : null;

    return {
      ...lot,
      highestBid: highestActiveBid || highestBid,
      bidCount: lot._count?.bids ?? bids.length,
    };
  }

  async create(farmerId: string, dto: CreateCropLotDto, userContext?: any) {
    // 1. Resolve Farmer Identity
    let farmerUser: any = userContext;
    if (!farmerUser && this.prisma.isConnected) {
      try {
        farmerUser = await this.prisma.user.findUnique({ where: { id: farmerId } });
      } catch {
        farmerUser = null;
      }
    }
    if (!farmerUser) {
      farmerUser = findInMemoryUserById(farmerId) || getAllInMemoryUsers().find((u) => u.id === farmerId);
    }

    if (!farmerUser) {
      throw new NotFoundException('Farmer account not found.');
    }

    // Role check
    if (farmerUser.role !== Role.FARMER && farmerUser.role !== Role.ADMIN) {
      throw new ForbiddenException('Only approved farmers can publish crop lots.');
    }

    // Approval status check
    if (farmerUser.approvalStatus === ApprovalStatus.PENDING) {
      throw new ForbiddenException('Your farmer account is awaiting admin approval.');
    }
    if (farmerUser.approvalStatus === ApprovalStatus.REJECTED) {
      throw new ForbiddenException('Your farmer registration was not approved.');
    }

    // 2. Resolve Crop
    let crop: any = null;
    if (this.prisma.isConnected) {
      try {
        crop = await this.prisma.crop.findUnique({ where: { id: dto.cropId } });
        if (!crop) {
          crop = await this.prisma.crop.findFirst({
            where: { name: { equals: dto.cropId, mode: 'insensitive' } },
          });
        }
      } catch {
        // Fallback
      }
    }
    if (!crop) {
      crop =
        FALLBACK_CROPS.find(
          (c) =>
            c.id === dto.cropId ||
            c.name.toLowerCase() === (dto.cropId || '').toLowerCase(),
        ) || FALLBACK_CROPS[0];
    }

    // 3. If Prisma is connected, ensure farmer exists in Prisma DB for FK relation, then create
    if (this.prisma.isConnected && crop) {
      try {
        const dbFarmer = await this.prisma.user.findUnique({ where: { id: farmerId } });
        if (!dbFarmer) {
          // Sync in-memory farmer to DB to satisfy FK constraint
          await this.prisma.user.create({
            data: {
              id: farmerUser.id,
              name: farmerUser.name,
              phone: farmerUser.phone,
              email: farmerUser.email,
              passwordHash: farmerUser.passwordHash || 'mock-hash',
              role: farmerUser.role,
              district: farmerUser.district,
              state: farmerUser.state,
              village: farmerUser.village,
              location: farmerUser.location,
              latitude: farmerUser.latitude,
              longitude: farmerUser.longitude,
              profilePhotoUrl: farmerUser.profilePhotoUrl,
              approvalStatus: farmerUser.approvalStatus || ApprovalStatus.APPROVED,
              verificationStatus: farmerUser.verificationStatus || VerificationStatus.VERIFIED,
              isVerified: farmerUser.isVerified ?? true,
              primaryCrop: farmerUser.primaryCrop,
              farmSize: farmerUser.farmSize,
              kccNumber: farmerUser.kccNumber,
              apmcNumber: farmerUser.apmcNumber,
            },
          }).catch(() => {});
        }

        const created = await this.prisma.cropLot.create({
          data: {
            farmerId: farmerUser.id,
            cropId: crop.id,
            quantity: Number(dto.quantity),
            unit: dto.unit || 'QUINTAL',
            expectedPrice: Number(dto.expectedPrice),
            qualityGrade: dto.qualityGrade || QualityGrade.GRADE_A,
            location: dto.location || farmerUser.location || `${farmerUser.district}, ${farmerUser.state}`,
            harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : new Date(),
            status: CropLotStatus.OPEN,
          },
          include: {
            crop: true,
            farmer: {
              select: {
                id: true,
                name: true,
                phone: true,
                district: true,
                state: true,
                isVerified: true,
              },
            },
          },
        });

        await this.auditService.log({
          actorId: farmerUser.id,
          action: AuditAction.LOT_CREATED,
          lotId: created.id,
          price: created.expectedPrice,
          newQuantity: created.quantity,
          metadata: { cropName: crop.name, location: created.location },
        });

        return this.enrichLot(created);
      } catch (err: any) {
        if (err instanceof NotFoundException || err instanceof ForbiddenException) throw err;
        // Fall through to in-memory lot creation on DB error
      }
    }

    // 4. In-Memory / Fallback Creation
    const newLot = {
      id: `lot-${Date.now()}`,
      farmerId: farmerUser.id,
      cropId: crop.id,
      quantity: Number(dto.quantity),
      unit: dto.unit || 'QUINTAL',
      expectedPrice: Number(dto.expectedPrice),
      qualityGrade: dto.qualityGrade || QualityGrade.GRADE_A,
      location: dto.location || farmerUser.location || `${farmerUser.district || 'Nashik'}, ${farmerUser.state || 'Maharashtra'}`,
      harvestDate: dto.harvestDate ? new Date(dto.harvestDate) : new Date(),
      status: CropLotStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      crop,
      farmer: {
        id: farmerUser.id,
        name: farmerUser.name,
        phone: farmerUser.phone || '9876543210',
        district: farmerUser.district || 'Nashik',
        state: farmerUser.state || 'Maharashtra',
        isVerified: farmerUser.isVerified ?? true,
      },
      bids: [],
      _count: { bids: 0 },
    };

    FALLBACK_LOTS.unshift(newLot);

    await this.auditService.log({
      actorId: farmerUser.id,
      action: AuditAction.LOT_CREATED,
      lotId: newLot.id,
      price: newLot.expectedPrice,
      newQuantity: newLot.quantity,
      metadata: { cropName: crop.name, location: newLot.location },
    });

    return this.enrichLot(newLot);
  }

  async findAll(query: QueryLotsDto) {
    if (!this.prisma.isConnected) {
      let filtered = [...FALLBACK_LOTS];
      if (query.farmerId) {
        filtered = filtered.filter((l) => l.farmerId === query.farmerId);
      }
      if (query.cropId) {
        filtered = filtered.filter((l) => l.cropId === query.cropId || l.crop.name.toLowerCase() === query.cropId.toLowerCase());
      }
      if (query.status) {
        filtered = filtered.filter((l) => l.status === query.status);
      }
      if (query.qualityGrade) {
        filtered = filtered.filter((l) => l.qualityGrade === query.qualityGrade);
      }
      return filtered.map((l) => this.enrichLot(l));
    }

    try {
      const where: any = {};
      if (query.cropId) where.cropId = query.cropId;
      if (query.farmerId) where.farmerId = query.farmerId;
      if (query.status) where.status = query.status;
      if (query.qualityGrade) where.qualityGrade = query.qualityGrade;
      if (query.location) where.location = { contains: query.location, mode: 'insensitive' };

      const lots = await this.prisma.cropLot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          crop: true,
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              district: true,
              state: true,
              isVerified: true,
            },
          },
          bids: {
            orderBy: { price: 'desc' },
            include: {
              buyer: {
                select: { id: true, name: true, district: true, state: true, isVerified: true },
              },
            },
          },
          transaction: {
            include: {
              buyer: { select: { id: true, name: true, district: true } },
              payment: true,
            },
          },
          _count: {
            select: { bids: true },
          },
        },
      });

      return lots.map((l) => this.enrichLot(l));
    } catch (err) {
      return FALLBACK_LOTS.map((l) => this.enrichLot(l));
    }
  }

  async findOne(id: string) {
    if (!this.prisma.isConnected) {
      const found = FALLBACK_LOTS.find((l) => l.id === id);
      if (!found) throw new NotFoundException(`Crop Lot with ID ${id} not found.`);
      return this.enrichLot(found);
    }

    try {
      const lot = await this.prisma.cropLot.findUnique({
        where: { id },
        include: {
          crop: true,
          farmer: {
            select: {
              id: true,
              name: true,
              phone: true,
              district: true,
              state: true,
              isVerified: true,
            },
          },
          bids: {
            orderBy: { price: 'desc' },
            include: {
              buyer: {
                select: {
                  id: true,
                  name: true,
                  district: true,
                  state: true,
                  isVerified: true,
                },
              },
            },
          },
          transaction: {
            include: {
              buyer: { select: { id: true, name: true, district: true } },
              payment: true,
            },
          },
        },
      });

      if (!lot) {
        throw new NotFoundException(`Crop Lot with ID ${id} not found.`);
      }

      return this.enrichLot(lot);
    } catch (err) {
      const found = FALLBACK_LOTS.find((l) => l.id === id);
      if (found) return this.enrichLot(found);
      throw new NotFoundException(`Crop Lot with ID ${id} not found.`);
    }
  }

  async update(lotId: string, userId: string, userRole: Role, dto: UpdateCropLotDto) {
    if (!this.prisma.isConnected) {
      const lot = FALLBACK_LOTS.find((l) => l.id === lotId);
      if (!lot) throw new NotFoundException(`Crop Lot with ID ${lotId} not found.`);
      if (lot.farmerId !== userId && userRole !== Role.ADMIN) {
        throw new ForbiddenException('You are not authorized to modify this lot.');
      }
      Object.assign(lot, dto, { updatedAt: new Date() });
      return this.enrichLot(lot);
    }

    try {
      const lot = await this.prisma.cropLot.findUnique({ where: { id: lotId } });
      if (!lot) throw new NotFoundException(`Crop Lot with ID ${lotId} not found.`);
      if (lot.farmerId !== userId && userRole !== Role.ADMIN) {
        throw new ForbiddenException('You are not authorized to modify this lot.');
      }
      if (lot.status === CropLotStatus.SOLD) {
        throw new BadRequestException('Sold lots cannot be modified.');
      }
      const updated = await this.prisma.cropLot.update({
        where: { id: lotId },
        data: dto,
        include: { crop: true, farmer: true },
      });
      return this.enrichLot(updated);
    } catch (err) {
      const lot = FALLBACK_LOTS.find((l) => l.id === lotId);
      if (lot) {
        Object.assign(lot, dto, { updatedAt: new Date() });
        return this.enrichLot(lot);
      }
      throw err;
    }
  }

  async cancel(lotId: string, userId: string, userRole: Role) {
    if (!this.prisma.isConnected) {
      const lot = FALLBACK_LOTS.find((l) => l.id === lotId);
      if (!lot) throw new NotFoundException(`Crop Lot with ID ${lotId} not found.`);
      lot.status = CropLotStatus.CANCELLED;
      return this.enrichLot(lot);
    }

    try {
      const lot = await this.prisma.cropLot.findUnique({
        where: { id: lotId },
        include: { bids: true },
      });
      if (!lot) throw new NotFoundException(`Crop Lot with ID ${lotId} not found.`);
      if (lot.farmerId !== userId && userRole !== Role.ADMIN) {
        throw new ForbiddenException('You are not authorized to cancel this lot.');
      }
      if (lot.status === CropLotStatus.SOLD) {
        throw new BadRequestException('A sold lot cannot be cancelled.');
      }
      const updated = await this.prisma.cropLot.update({
        where: { id: lotId },
        data: { status: CropLotStatus.CANCELLED },
      });
      return this.enrichLot(updated);
    } catch (err) {
      const lot = FALLBACK_LOTS.find((l) => l.id === lotId);
      if (lot) {
        lot.status = CropLotStatus.CANCELLED;
        return this.enrichLot(lot);
      }
      throw err;
    }
  }
}
