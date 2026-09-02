import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { findInMemoryUserById, getAllInMemoryUsers } from '../fallback-users';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'vanijya_super_secret_jwt_key_sih2024',
    });
  }

  async validate(payload: { sub: string; role: string }) {
    // 1. Try PostgreSQL database lookup
    if (this.prisma.isConnected) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
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
          },
        });

        if (user) {
          return user;
        }
      } catch {
        // Fall through to in-memory lookup
      }
    }

    // 2. Try global in-memory registry lookup (for demo and offline resilience)
    const inMemUser = findInMemoryUserById(payload.sub) || getAllInMemoryUsers().find((u) => u.id === payload.sub);
    if (inMemUser) {
      const { password, passwordHash, ...safeUser } = inMemUser;
      return safeUser;
    }

    throw new UnauthorizedException('Session expired. Please sign in again.');
  }
}
