import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FALLBACK_USERS } from '../auth/fallback-users';
import { AuditService } from '../audit/audit.service';
import { Role, AuditAction } from '@prisma/client';
import { isValidState, isValidDistrict } from '@vanijya/shared-utils';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getProfile(userId: string) {
    if (!this.prisma.isConnected) {
      const fallbackUser = FALLBACK_USERS.find((u) => u.id === userId);
      if (!fallbackUser) throw new NotFoundException('User not found.');
      return fallbackUser;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async getPublicProfile(userId: string) {
    if (!this.prisma.isConnected) {
      const u = FALLBACK_USERS.find((user) => user.id === userId);
      if (!u) throw new NotFoundException('User not found.');
      return {
        id: u.id,
        name: u.name,
        role: u.role,
        district: u.district,
        state: u.state,
        village: u.village,
        profilePhotoUrl: u.profilePhotoUrl,
        isVerified: u.isVerified,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        district: true,
        state: true,
        village: true,
        profilePhotoUrl: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return {
      id: user.id,
      name: user.name,
      role: user.role,
      district: user.district,
      state: user.state,
      village: user.village,
      profilePhotoUrl: user.profilePhotoUrl,
      isVerified: user.isVerified,
    };
  }

  async getProfileCompletion(userId: string) {
    const user = await this.getProfile(userId);
    return this.calculateCompletion(user);
  }

  calculateCompletion(user: any) {
    let requiredFields: { key: string; label: string }[] = [];

    if (user.role === Role.FARMER) {
      requiredFields = [
        { key: 'name', label: 'Full Legal Name' },
        { key: 'phone', label: 'Mobile Number' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'village', label: 'Village / Town' },
        { key: 'location', label: 'Farm Location Address' },
        { key: 'profilePhotoUrl', label: 'Profile Photo' },
      ];
    } else if (user.role === Role.BUYER) {
      requiredFields = [
        { key: 'organizationName', label: 'Organization Name' },
        { key: 'contactPerson', label: 'Contact Person' },
        { key: 'phone', label: 'Mobile Number' },
        { key: 'email', label: 'Email Address' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'location', label: 'Procurement / Office Location' },
        { key: 'profilePhotoUrl', label: 'Profile Photo' },
      ];
    } else {
      requiredFields = [
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
      ];
    }

    const completedFields: string[] = [];
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const val = user[field.key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        completedFields.push(field.label);
      } else {
        missingFields.push(field.label);
      }
    }

    const percentage = Math.round((completedFields.length / requiredFields.length) * 100);

    return {
      percentage,
      completedFields,
      missingFields,
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    if (dto.state && !isValidState(dto.state)) {
      throw new BadRequestException(`Invalid State: '${dto.state}'.`);
    }

    if (dto.state && dto.district && !isValidDistrict(dto.state, dto.district)) {
      throw new BadRequestException(
        `District '${dto.district}' is not valid for state '${dto.state}'.`,
      );
    }

    let updatedUser: any;

    if (this.prisma.isConnected) {
      updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: dto,
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
          updatedAt: true,
        },
      });
    } else {
      const user = FALLBACK_USERS.find((u) => u.id === userId);
      if (!user) throw new NotFoundException('User not found.');
      Object.assign(user, dto);
      updatedUser = user;
    }

    // Audit Log
    let auditAction: AuditAction = AuditAction.PROFILE_UPDATED;
    if (dto.profilePhotoUrl) auditAction = AuditAction.PROFILE_PHOTO_UPDATED;
    else if (dto.latitude !== undefined || dto.longitude !== undefined)
      auditAction = AuditAction.LOCATION_UPDATED;

    await this.auditService.log({
      actorId: userId,
      action: auditAction,
      metadata: dto,
    });

    return updatedUser;
  }
}
