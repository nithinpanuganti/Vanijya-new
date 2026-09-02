import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, ApprovalStatus, VerificationStatus } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  phone: string | null;

  @ApiProperty({ nullable: true })
  email: string | null;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ nullable: true })
  district: string | null;

  @ApiProperty({ nullable: true })
  state: string | null;

  @ApiProperty({ nullable: true })
  village: string | null;

  @ApiProperty({ nullable: true })
  location: string | null;

  @ApiPropertyOptional({ nullable: true })
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  longitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  profilePhotoUrl?: string | null;

  @ApiProperty({ enum: ApprovalStatus })
  approvalStatus: ApprovalStatus;

  @ApiProperty({ enum: VerificationStatus })
  verificationStatus: VerificationStatus;

  @ApiProperty()
  isVerified: boolean;

  @ApiPropertyOptional({ nullable: true })
  rejectionReason?: string | null;

  // Farmer specific
  @ApiPropertyOptional({ nullable: true })
  primaryCrop?: string | null;

  @ApiPropertyOptional({ nullable: true })
  farmSize?: number | null;

  @ApiPropertyOptional({ nullable: true })
  kccNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  apmcNumber?: string | null;

  // Buyer specific
  @ApiPropertyOptional({ nullable: true })
  organizationName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  contactPerson?: string | null;

  @ApiPropertyOptional({ nullable: true })
  businessType?: string | null;

  @ApiPropertyOptional({ nullable: true })
  gstin?: string | null;

  @ApiPropertyOptional({ nullable: true })
  fssaiNumber?: string | null;

  @ApiPropertyOptional({ nullable: true })
  warehouseLocation?: string | null;
}

export class RegisterResponseDto {
  @ApiProperty({ example: 'Registration submitted successfully. Awaiting administrator approval.' })
  message: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT Bearer Access Token' })
  accessToken: string;

  @ApiProperty({ type: UserProfileDto })
  user: UserProfileDto;
}
