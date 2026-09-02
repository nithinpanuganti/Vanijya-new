import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Role } from '@prisma/client';
import { FALLBACK_USERS } from '../auth/fallback-users';

export interface AuditEntry {
  id?: string;
  bidId?: string;
  lotId?: string;
  actorId: string;
  targetUserId?: string;
  action: AuditAction;
  oldQuantity?: number;
  newQuantity?: number;
  oldStatus?: string;
  newStatus?: string;
  price?: number;
  metadata?: any;
  createdAt?: Date;
}

export const FALLBACK_AUDIT_LOGS: any[] = [
  {
    id: 'audit-demo-1',
    actorId: 'usr-farmer-1',
    actorName: 'Ramesh Patel',
    actorRole: 'FARMER',
    action: AuditAction.LOT_CREATED,
    lotId: 'lot-demo-1',
    price: 2200,
    newQuantity: 100,
    createdAt: new Date(Date.now() - 3600000 * 4),
    metadata: { cropName: 'Tomato', location: 'Nashik' },
  },
  {
    id: 'audit-demo-2',
    actorId: 'usr-buyer-1',
    actorName: 'FreshCart Agro Ltd.',
    actorRole: 'BUYER',
    action: AuditAction.BID_PLACED,
    lotId: 'lot-demo-1',
    bidId: 'bid-demo-1',
    price: 2250,
    newQuantity: 100,
    createdAt: new Date(Date.now() - 3600000 * 2),
    metadata: { cropName: 'Tomato', message: 'Direct warehouse pickup' },
  },
];

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    const actor = FALLBACK_USERS.find((u) => u.id === entry.actorId);
    const logItem = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...entry,
      actorName: actor?.name || 'System User',
      actorRole: actor?.role || 'FARMER',
      createdAt: entry.createdAt || new Date(),
    };

    FALLBACK_AUDIT_LOGS.unshift(logItem);

    if (this.prisma.isConnected) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorId: entry.actorId,
            targetUserId: entry.targetUserId,
            action: entry.action,
            bidId: entry.bidId,
            lotId: entry.lotId,
            oldQuantity: entry.oldQuantity,
            newQuantity: entry.newQuantity,
            oldStatus: entry.oldStatus,
            newStatus: entry.newStatus,
            price: entry.price,
            metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          },
        });
      } catch (err) {
        // Safe fallback in memory
      }
    }

    return logItem;
  }

  async getRecent(limit: number = 50) {
    if (!this.prisma.isConnected) {
      return FALLBACK_AUDIT_LOGS.slice(0, limit);
    }

    try {
      const logs = await this.prisma.auditLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, role: true, district: true },
          },
          targetUser: {
            select: { id: true, name: true, role: true },
          },
          lot: {
            include: { crop: true },
          },
          bid: true,
        },
      });

      return logs.map((l) => ({
        id: l.id,
        actorId: l.actorId,
        actorName: l.actor?.name || 'User',
        actorRole: l.actor?.role || 'FARMER',
        targetUserId: l.targetUserId,
        targetUserName: l.targetUser?.name,
        action: l.action,
        lotId: l.lotId,
        bidId: l.bidId,
        oldQuantity: l.oldQuantity,
        newQuantity: l.newQuantity,
        oldStatus: l.oldStatus,
        newStatus: l.newStatus,
        price: l.price,
        cropName: l.lot?.crop?.name,
        metadata: l.metadata ? (typeof l.metadata === 'string' ? JSON.parse(l.metadata) : l.metadata) : null,
        createdAt: l.createdAt,
      }));
    } catch (err) {
      return FALLBACK_AUDIT_LOGS.slice(0, limit);
    }
  }
}
