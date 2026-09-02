import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Role } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'Ramesh Patel', description: 'Full legal name or organization name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @ApiPropertyOptional({ example: '9876543210', description: '10-digit Indian Mobile Number' })
  @IsString()
  @IsOptional()
  @Matches(/^[6-9]\d{9}$/, { message: 'Please provide a valid 10-digit Indian mobile number.' })
  phone?: string;

  @ApiPropertyOptional({ example: 'ramesh@farmer.in', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'Farmer@123',
    description:
      'Minimum 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  })
  password: string;

  @ApiProperty({ enum: [Role.FARMER, Role.BUYER], default: Role.FARMER, description: 'Role of the account: FARMER or BUYER' })
  @IsEnum(Role, { message: 'Role must be either FARMER or BUYER.' })
  role: Role;

  @ApiProperty({ example: 'Maharashtra', description: 'Official Indian State or Union Territory' })
  @IsString()
  @IsNotEmpty({ message: 'State is required.' })
  state: string;

  @ApiProperty({ example: 'Nashik', description: 'District belonging to the selected state' })
  @IsString()
  @IsNotEmpty({ message: 'District is required.' })
  district: string;

  @ApiPropertyOptional({ example: 'Pimpalgaon', description: 'Village or Town name' })
  @IsString()
  @IsOptional()
  village?: string;

  @ApiPropertyOptional({ example: 'Village Pimpalgaon, Niphad', description: 'Farm or Procurement Location Address' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 20.1704, description: 'Live GPS Latitude coordinate' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Valid live GPS latitude coordinate is required.' })
  @IsNotEmpty({ message: 'Live GPS location is required.' })
  latitude: number;

  @ApiProperty({ example: 73.9877, description: 'Live GPS Longitude coordinate' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Valid live GPS longitude coordinate is required.' })
  @IsNotEmpty({ message: 'Live GPS location is required.' })
  longitude: number;

  @ApiPropertyOptional({ example: '/api/uploads/profile-photos/photo-123.jpg', description: 'Profile photo URL or reference (optional if multipart file provided)' })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  // --- Farmer Specific Fields ---
  @ApiPropertyOptional({ example: 'Tomato', description: 'Primary agricultural crop' })
  @IsString()
  @IsOptional()
  primaryCrop?: string;

  @ApiPropertyOptional({ example: 4.5, description: 'Farm size in Acres' })
  @Type(() => Number)
  @IsNumber({}, { message: 'Farm size must be a number' })
  @IsOptional()
  farmSize?: number;

  @ApiPropertyOptional({ example: 'KCC-MH-2024-8891', description: 'Kisan Credit Card number (optional)' })
  @IsString()
  @IsOptional()
  kccNumber?: string;

  @ApiPropertyOptional({ example: 'APMC-NSK-4421', description: 'APMC Registration number (optional)' })
  @IsString()
  @IsOptional()
  apmcNumber?: string;

  // --- Buyer Specific Fields ---
  @ApiPropertyOptional({ example: 'FreshCart Agro Limited', description: 'Buyer Organization Name' })
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiPropertyOptional({ example: 'Vikram Joshi', description: 'Authorized contact person' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'WHOLESALER', description: 'Type of Business: WHOLESALER, RETAILER, EXPORTER, PROCESSOR' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ example: '27AABCF1234F1Z5', description: '15-digit GSTIN (optional)' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ example: '11521018000234', description: '14-digit FSSAI Food Safety License (optional)' })
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional({ example: 'Sector 19, Vashi Turbhe Road, Navi Mumbai', description: 'Warehouse / Processing Plant Location' })
  @IsString()
  @IsOptional()
  warehouseLocation?: string;
}
