import { Role, ApprovalStatus, VerificationStatus } from '@prisma/client';

export interface InMemUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  password?: string;
  passwordHash?: string;
  role: Role;
  district?: string;
  state?: string;
  village?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  profilePhotoUrl?: string;
  approvalStatus: ApprovalStatus;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: Date;
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
  createdAt?: Date;
}

// Global in-memory storage for newly registered users across all services
export const IN_MEMORY_REGISTERED_USERS: InMemUser[] = [];

// Initial baseline seed users
export const FALLBACK_USERS: InMemUser[] = [
  {
    id: 'usr-farmer-1',
    name: 'Ramesh Patel',
    phone: '9876543210',
    email: 'ramesh@farmer.in',
    password: 'Farmer@123',
    role: Role.FARMER,
    district: 'Nashik',
    state: 'Maharashtra',
    village: 'Pimpalgaon',
    location: 'Village Pimpalgaon, Niphad Taluka, Nashik',
    latitude: 20.1704,
    longitude: 73.9877,
    profilePhotoUrl: '/api/uploads/profile-photos/ramesh-patel.jpg',
    approvalStatus: ApprovalStatus.APPROVED,
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    primaryCrop: 'Tomato',
    farmSize: 4.5,
    kccNumber: 'KCC-MH-2024-8891',
    apmcNumber: 'APMC-NSK-4421',
    createdAt: new Date('2026-08-01T08:00:00Z'),
  },
  {
    id: 'usr-farmer-2',
    name: 'Gurpreet Singh',
    phone: '9876543211',
    email: 'gurpreet@farmer.in',
    password: 'Farmer@123',
    role: Role.FARMER,
    district: 'Ludhiana',
    state: 'Punjab',
    village: 'Samrala',
    location: 'Khanna Mandi Road, Ludhiana',
    latitude: 30.7046,
    longitude: 76.1957,
    profilePhotoUrl: '/api/uploads/profile-photos/gurpreet-singh.jpg',
    approvalStatus: ApprovalStatus.APPROVED,
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    primaryCrop: 'Wheat',
    farmSize: 8.0,
    kccNumber: 'KCC-PB-2023-1102',
    apmcNumber: 'APMC-LDH-0982',
    createdAt: new Date('2026-08-05T09:30:00Z'),
  },
  {
    id: 'usr-farmer-pending-1',
    name: 'Kailash Choudhary',
    phone: '9876543212',
    email: 'kailash@farmer.in',
    password: 'Farmer@123',
    role: Role.FARMER,
    district: 'Jaipur',
    state: 'Rajasthan',
    village: 'Chomu',
    location: 'Chomu Mandi Link Road, Jaipur',
    latitude: 27.1726,
    longitude: 75.7224,
    profilePhotoUrl: '/api/uploads/profile-photos/kailash-choudhary.jpg',
    approvalStatus: ApprovalStatus.PENDING,
    verificationStatus: VerificationStatus.PENDING,
    isVerified: false,
    primaryCrop: 'Mustard',
    farmSize: 6.2,
    kccNumber: 'KCC-RJ-2024-5512',
    apmcNumber: 'APMC-JPR-7781',
    createdAt: new Date('2026-09-01T10:15:00Z'),
  },
  {
    id: 'usr-buyer-1',
    name: 'FreshCart Agro Ltd.',
    phone: '9876543220',
    email: 'buyer@freshcart.com',
    password: 'buyer123',
    role: Role.BUYER,
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    location: 'Vashi APMC Complex, Navi Mumbai',
    latitude: 19.076,
    longitude: 72.8777,
    profilePhotoUrl: '/api/uploads/profile-photos/freshcart.jpg',
    approvalStatus: ApprovalStatus.APPROVED,
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    organizationName: 'FreshCart Agro Limited',
    contactPerson: 'Vikram Joshi',
    businessType: 'WHOLESALER',
    gstin: '27AABCF1234F1Z5',
    fssaiNumber: '11521018000234',
    warehouseLocation: 'Sector 19, Vashi Turbhe Road, Navi Mumbai',
    createdAt: new Date('2026-08-02T11:00:00Z'),
  },
  {
    id: 'usr-buyer-2',
    name: 'GreenSpire Foods',
    phone: '9876543221',
    email: 'procurement@greenspire.in',
    password: 'buyer123',
    role: Role.BUYER,
    district: 'North Delhi',
    state: 'Delhi',
    location: 'Azadpur Trade Terminal, North Delhi',
    latitude: 28.7041,
    longitude: 77.1025,
    profilePhotoUrl: '/api/uploads/profile-photos/greenspire.jpg',
    approvalStatus: ApprovalStatus.APPROVED,
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    organizationName: 'GreenSpire Food Processing Pvt Ltd',
    contactPerson: 'Anjali Sharma',
    businessType: 'PROCESSOR',
    gstin: '07AAECG5678P1ZQ',
    fssaiNumber: '10019011000543',
    warehouseLocation: 'Gate 4, Azadpur Mandi Complex, New Delhi',
    createdAt: new Date('2026-08-08T14:20:00Z'),
  },
  {
    id: 'usr-buyer-pending-1',
    name: 'AgroPure Commodities',
    phone: '9876543222',
    email: 'procure@agropure.com',
    password: 'buyer123',
    role: Role.BUYER,
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    location: 'Yeshwanthpur Mandi Terminal, Bengaluru',
    latitude: 13.0284,
    longitude: 77.5408,
    profilePhotoUrl: '/api/uploads/profile-photos/agropure.jpg',
    approvalStatus: ApprovalStatus.PENDING,
    verificationStatus: VerificationStatus.PENDING,
    isVerified: false,
    organizationName: 'AgroPure Commodities Pvt Ltd',
    contactPerson: 'Siddharth Rao',
    businessType: 'PROCESSOR',
    gstin: '29AABCA9876F1Z2',
    fssaiNumber: '11223019000876',
    warehouseLocation: 'Plot 45, Peenya Industrial Area, Bengaluru',
    createdAt: new Date('2026-09-02T06:45:00Z'),
  },
  {
    id: 'usr-admin-1',
    name: 'Vanijya System Admin',
    phone: '9876543230',
    email: 'admin@vanijya.gov.in',
    password: 'Admin@123',
    role: Role.ADMIN,
    district: 'Central Delhi',
    state: 'Delhi',
    location: 'Ministry of Agriculture, Krishi Bhawan, New Delhi',
    latitude: 28.6195,
    longitude: 77.214,
    profilePhotoUrl: '/api/uploads/profile-photos/admin.jpg',
    approvalStatus: ApprovalStatus.APPROVED,
    verificationStatus: VerificationStatus.VERIFIED,
    isVerified: true,
    createdAt: new Date('2026-07-01T00:00:00Z'),
  },
];

export function addInMemoryRegisteredUser(user: InMemUser) {
  const existingIndex = IN_MEMORY_REGISTERED_USERS.findIndex((u) => u.id === user.id);
  if (existingIndex >= 0) {
    IN_MEMORY_REGISTERED_USERS[existingIndex] = user;
  } else {
    IN_MEMORY_REGISTERED_USERS.unshift(user);
  }
}

export function getAllInMemoryUsers(): InMemUser[] {
  return [...IN_MEMORY_REGISTERED_USERS, ...FALLBACK_USERS];
}

export function findInMemoryUserById(id: string): InMemUser | undefined {
  return getAllInMemoryUsers().find((u) => u.id === id);
}

export function findInMemoryUserByIdentifier(identifier: string): InMemUser | undefined {
  return getAllInMemoryUsers().find(
    (u) => u.phone === identifier || u.email === identifier,
  );
}

export function updateInMemoryUser(
  id: string,
  updates: Partial<InMemUser>,
): InMemUser | null {
  const inMem = IN_MEMORY_REGISTERED_USERS.find((u) => u.id === id);
  if (inMem) {
    Object.assign(inMem, updates);
    return inMem;
  }
  const fallback = FALLBACK_USERS.find((u) => u.id === id);
  if (fallback) {
    Object.assign(fallback, updates);
    return fallback;
  }
  return null;
}
