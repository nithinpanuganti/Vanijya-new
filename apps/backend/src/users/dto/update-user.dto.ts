import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ramesh Patel' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Nashik' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: 'Maharashtra' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Pimpalgaon' })
  @IsString()
  @IsOptional()
  village?: string;

  @ApiPropertyOptional({ example: 'Village Pimpalgaon, Niphad, Nashik' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 20.1704 })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: 73.9877 })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: '/api/uploads/profile-photos/photo-123.jpg' })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  // Farmer
  @ApiPropertyOptional({ example: 'Tomato' })
  @IsString()
  @IsOptional()
  primaryCrop?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @IsNumber()
  @IsOptional()
  farmSize?: number;

  @ApiPropertyOptional({ example: 'KCC-MH-2024-8891' })
  @IsString()
  @IsOptional()
  kccNumber?: string;

  @ApiPropertyOptional({ example: 'APMC-NSK-4421' })
  @IsString()
  @IsOptional()
  apmcNumber?: string;

  // Buyer
  @ApiPropertyOptional({ example: 'FreshCart Agro Ltd' })
  @IsString()
  @IsOptional()
  organizationName?: string;

  @ApiPropertyOptional({ example: 'Vikram Joshi' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'WHOLESALER' })
  @IsString()
  @IsOptional()
  businessType?: string;

  @ApiPropertyOptional({ example: '27AABCF1234F1Z5' })
  @IsString()
  @IsOptional()
  gstin?: string;

  @ApiPropertyOptional({ example: '11521018000234' })
  @IsString()
  @IsOptional()
  fssaiNumber?: string;

  @ApiPropertyOptional({ example: 'Sector 19, Vashi Turbhe Road, Navi Mumbai' })
  @IsString()
  @IsOptional()
  warehouseLocation?: string;
}
