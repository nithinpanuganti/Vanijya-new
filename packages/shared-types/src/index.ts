/**
 * Vanijya Shared Types & Domain Enums
 * Smart India Hackathon (SIH) Problem Statement 26132
 */

export enum UserRole {
  FARMER = 'FARMER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum CropLotStatus {
  OPEN = 'OPEN',
  BIDDING = 'BIDDING',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
}

export enum BidStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum TransactionStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  PAID = 'PAID',
  FAILED = 'FAILED',
}

export enum QualityGrade {
  GRADE_A = 'GRADE_A',
  GRADE_B = 'GRADE_B',
  GRADE_C = 'GRADE_C',
}

export enum CropUnit {
  QUINTAL = 'QUINTAL',
  KG = 'KG',
  TONNE = 'TONNE',
}

export enum AuditAction {
  LOT_CREATED = 'LOT_CREATED',
  BID_PLACED = 'BID_PLACED',
  QUANTITY_MODIFIED = 'QUANTITY_MODIFIED',
  BID_CANCELLED = 'BID_CANCELLED',
  BID_ACCEPTED = 'BID_ACCEPTED',
  BID_REJECTED = 'BID_REJECTED',
  PAYMENT_PAID = 'PAYMENT_PAID',
  REGISTRATION_SUBMITTED = 'REGISTRATION_SUBMITTED',
  REGISTRATION_APPROVED = 'REGISTRATION_APPROVED',
  REGISTRATION_REJECTED = 'REGISTRATION_REJECTED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  PROFILE_PHOTO_UPDATED = 'PROFILE_PHOTO_UPDATED',
  LOCATION_UPDATED = 'LOCATION_UPDATED',
  LOGIN = 'LOGIN',
}

export interface UserDTO {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  location?: string;
  district?: string;
  state?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
  profilePhotoUrl?: string;
  approvalStatus?: ApprovalStatus;
  verificationStatus?: VerificationStatus;
  isVerified: boolean;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  // Farmer fields
  primaryCrop?: string;
  farmSize?: number;
  kccNumber?: string;
  apmcNumber?: string;
  // Buyer fields
  organizationName?: string;
  contactPerson?: string;
  businessType?: string;
  gstin?: string;
  fssaiNumber?: string;
  warehouseLocation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PublicProfileDTO {
  id: string;
  name: string;
  role: UserRole;
  state?: string;
  district?: string;
  village?: string;
  isVerified: boolean;
  profilePhotoUrl?: string;
}

export interface ProfileCompletionDTO {
  percentage: number;
  missingFields: string[];
  completedFields: string[];
}

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface RegistrationRequestDTO {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  state?: string;
  district?: string;
  village?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  profilePhotoUrl?: string;
  approvalStatus: ApprovalStatus;
  verificationStatus: VerificationStatus;
  rejectionReason?: string;
  createdAt: string;
  // Role specific metadata
  primaryCrop?: string;
  farmSize?: number;
  kccNumber?: string;
  apmcNumber?: string;
  organizationName?: string;
  contactPerson?: string;
  businessType?: string;
  gstin?: string;
  fssaiNumber?: string;
  warehouseLocation?: string;
}

export interface CropDTO {
  id: string;
  name: string;
  category: string;
  defaultUnit: CropUnit;
}

export interface MarketDTO {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude?: number;
  longitude?: number;
}

export interface MandiPriceDTO {
  id: string;
  cropId: string;
  marketId: string;
  cropName?: string;
  marketName?: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalQuantity: number;
  date: string;
  source: 'AGMARKNET' | 'MOCK';
}

export interface CropLotDTO {
  id: string;
  farmerId: string;
  cropId: string;
  cropName?: string;
  quantity: number;
  unit: CropUnit | string;
  expectedPrice: number;
  qualityGrade: QualityGrade | string;
  location: string;
  harvestDate: string;
  status: CropLotStatus;
  farmerName?: string;
  farmerVerified?: boolean;
  createdAt: string;
}

export interface BidDTO {
  id: string;
  lotId: string;
  buyerId: string;
  buyerName?: string;
  price: number;
  quantity: number;
  message?: string;
  status: BidStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TransactionDTO {
  id: string;
  lotId: string;
  buyerId: string;
  farmerId: string;
  acceptedBidId: string;
  agreedPrice: number;
  quantity: number;
  totalAmount: number;
  status: TransactionStatus;
  createdAt: string;
}

export interface PaymentDTO {
  id: string;
  transactionId: string;
  amount: number;
  status: PaymentStatus;
  reference?: string;
  updatedAt: string;
}

export interface AuditLogDTO {
  id: string;
  bidId?: string;
  lotId?: string;
  actorId: string;
  actorName?: string;
  actorRole?: string;
  action: AuditAction | string;
  oldQuantity?: number;
  newQuantity?: number;
  oldStatus?: string;
  newStatus?: string;
  price?: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdminDashboardStats {
  totalFarmers: number;
  totalBuyers: number;
  pendingFarmers: number;
  pendingBuyers: number;
  pendingRegistrations: number;
  activeLots: number;
  activeBiddingLots: number;
  soldLots: number;
  cancelledLots: number;
  pendingBids: number;
  acceptedBids: number;
  cancelledBids: number;
  modifiedBids: number;
  totalTransactionValue: number;
  pendingPaymentsValue: number;
  completedPaymentsValue: number;
  recentActivity: AuditLogDTO[];
}
