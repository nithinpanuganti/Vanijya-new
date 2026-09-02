import {
  PrismaClient,
  Role,
  ApprovalStatus,
  VerificationStatus,
  CropLotStatus,
  BidStatus,
  TransactionStatus,
  PaymentStatus,
  PriceSource,
  QualityGrade,
  CropUnit,
  AuditAction,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Vanijya Agricultural Database...');

  // 1. Clean existing records in reverse dependency order
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.cropLot.deleteMany();
  await prisma.mandiPrice.deleteMany();
  await prisma.market.deleteMany();
  await prisma.crop.deleteMany();
  await prisma.user.deleteMany();

  const saltRounds = 10;
  const farmerPassword = await bcrypt.hash('farmer123', saltRounds);
  const buyerPassword = await bcrypt.hash('buyer123', saltRounds);
  const adminPassword = await bcrypt.hash('admin123', saltRounds);

  // 2. Seed Users
  // 2.1 Farmer Accounts (Approved & Pending)
  const ramesh = await prisma.user.create({
    data: {
      name: 'Ramesh Patel',
      phone: '9876543210',
      email: 'ramesh@farmer.in',
      passwordHash: farmerPassword,
      role: Role.FARMER,
      district: 'Nashik',
      state: 'Maharashtra',
      village: 'Pimpalgaon',
      location: 'Village Pimpalgaon, Niphad, Nashik',
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
    },
  });

  const gurpreet = await prisma.user.create({
    data: {
      name: 'Gurpreet Singh',
      phone: '9876543211',
      email: 'gurpreet@farmer.in',
      passwordHash: farmerPassword,
      role: Role.FARMER,
      district: 'Ludhiana',
      state: 'Punjab',
      village: 'Samrala',
      location: 'Samrala Road, Khanna, Ludhiana',
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
    },
  });

  const kailash = await prisma.user.create({
    data: {
      name: 'Kailash Choudhary',
      phone: '9876543212',
      email: 'kailash@farmer.in',
      passwordHash: farmerPassword,
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
    },
  });

  // 2.2 Buyer Accounts (Approved & Pending)
  const freshCart = await prisma.user.create({
    data: {
      name: 'FreshCart Agro Ltd.',
      phone: '9876543220',
      email: 'buyer@freshcart.com',
      passwordHash: buyerPassword,
      role: Role.BUYER,
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      location: 'Vashi APMC Commercial Yard, Navi Mumbai',
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
    },
  });

  const greenSpire = await prisma.user.create({
    data: {
      name: 'GreenSpire Foods',
      phone: '9876543221',
      email: 'procurement@greenspire.in',
      passwordHash: buyerPassword,
      role: Role.BUYER,
      district: 'North Delhi',
      state: 'Delhi',
      location: 'Azadpur Terminal, New Delhi',
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
    },
  });

  const agroPure = await prisma.user.create({
    data: {
      name: 'AgroPure Commodities',
      phone: '9876543222',
      email: 'procure@agropure.com',
      passwordHash: buyerPassword,
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
    },
  });

  // 2.3 Administrator Account
  const adminUser = await prisma.user.create({
    data: {
      name: 'Vanijya System Admin',
      phone: '9876543230',
      email: 'admin@vanijya.gov.in',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      district: 'Central Delhi',
      state: 'Delhi',
      location: 'Krishi Bhawan, New Delhi',
      latitude: 28.6195,
      longitude: 77.214,
      profilePhotoUrl: '/api/uploads/profile-photos/admin.jpg',
      approvalStatus: ApprovalStatus.APPROVED,
      verificationStatus: VerificationStatus.VERIFIED,
      isVerified: true,
    },
  });

  console.log(`✅ Seeded Users: 3 Farmers (2 Approved, 1 Pending), 3 Buyers (2 Approved, 1 Pending), 1 Admin`);

  // Create initial notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: ramesh.id,
        title: 'Account Approved',
        message: 'Your Vanijya Farmer account has been approved. You can now list crop lots and receive direct buyer bids.',
        type: 'APPROVAL',
        isRead: false,
      },
      {
        userId: kailash.id,
        title: 'Registration Submitted',
        message: 'Your farmer registration has been submitted and is currently under administrative verification.',
        type: 'REGISTRATION',
        isRead: false,
      },
      {
        userId: freshCart.id,
        title: 'Account Approved',
        message: 'Your Vanijya Buyer account has been approved. You can now discover crop lots and place bids directly.',
        type: 'APPROVAL',
        isRead: false,
      },
      {
        userId: agroPure.id,
        title: 'Registration Submitted',
        message: 'Your buyer procurement registration has been submitted and is awaiting administrator verification.',
        type: 'REGISTRATION',
        isRead: false,
      },
      {
        userId: adminUser.id,
        title: 'System Initialized',
        message: 'Vanijya Unified Platform is online. Monitoring price feeds and user registrations.',
        type: 'SYSTEM',
        isRead: true,
      },
    ],
  });

  // 3. Seed Crops
  const cropsData = [
    { name: 'Tomato', category: 'Vegetable', defaultUnit: CropUnit.QUINTAL },
    { name: 'Onion', category: 'Vegetable', defaultUnit: CropUnit.QUINTAL },
    { name: 'Potato', category: 'Vegetable', defaultUnit: CropUnit.QUINTAL },
    { name: 'Wheat', category: 'Cereal', defaultUnit: CropUnit.QUINTAL },
    { name: 'Paddy', category: 'Cereal', defaultUnit: CropUnit.QUINTAL },
    { name: 'Cotton', category: 'Fiber', defaultUnit: CropUnit.QUINTAL },
    { name: 'Soybean', category: 'Oilseed', defaultUnit: CropUnit.QUINTAL },
    { name: 'Chilli', category: 'Spice', defaultUnit: CropUnit.QUINTAL },
  ];

  const crops = await Promise.all(
    cropsData.map((c) => prisma.crop.create({ data: c })),
  );

  const cropMap = new Map(crops.map((c) => [c.name, c.id]));
  console.log(`✅ Seeded Crops: ${crops.length} agricultural commodities`);

  // 4. Seed Markets
  const marketsData = [
    { name: 'Nashik APMC', district: 'Nashik', state: 'Maharashtra', latitude: 19.9975, longitude: 73.7898 },
    { name: 'Pimpalgaon APMC', district: 'Nashik', state: 'Maharashtra', latitude: 20.1704, longitude: 73.9877 },
    { name: 'Lasalgaon APMC', district: 'Nashik', state: 'Maharashtra', latitude: 20.1458, longitude: 74.2289 },
    { name: 'Vashi Market Yard', district: 'Mumbai Suburban', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
    { name: 'Pune APMC (Gultekdi)', district: 'Pune', state: 'Maharashtra', latitude: 18.4967, longitude: 73.8647 },
    { name: 'Khanna Grain Market', district: 'Ludhiana', state: 'Punjab', latitude: 30.7046, longitude: 76.2163 },
    { name: 'Azadpur Mandi', district: 'North Delhi', state: 'Delhi', latitude: 28.7041, longitude: 77.1025 },
  ];

  const markets = await Promise.all(
    marketsData.map((m) => prisma.market.create({ data: m })),
  );
  console.log(`✅ Seeded Markets: ${markets.length} regulated APMC markets`);

  // 5. Seed Mandi Prices (Historical & Today's Benchmark)
  const today = new Date();
  const mandiPricesToCreate = [];

  for (const crop of crops) {
    for (const market of markets) {
      let baseModal = 2000;
      if (crop.name === 'Tomato') baseModal = 2200;
      else if (crop.name === 'Onion') baseModal = 1850;
      else if (crop.name === 'Wheat') baseModal = 2450;
      else if (crop.name === 'Paddy') baseModal = 2183;
      else if (crop.name === 'Cotton') baseModal = 6800;
      else if (crop.name === 'Soybean') baseModal = 4600;
      else if (crop.name === 'Chilli') baseModal = 14000;

      for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
        const priceDate = new Date(today);
        priceDate.setDate(today.getDate() - dayOffset);
        priceDate.setHours(10, 0, 0, 0);

        const variance = (Math.random() - 0.5) * (baseModal * 0.08);
        const modal = Math.round(baseModal + variance);
        const min = Math.round(modal * 0.9);
        const max = Math.round(modal * 1.12);
        const arrival = Math.round(150 + Math.random() * 400);

        mandiPricesToCreate.push({
          cropId: crop.id,
          marketId: market.id,
          minPrice: min,
          maxPrice: max,
          modalPrice: modal,
          arrivalQuantity: arrival,
          date: priceDate,
          source: PriceSource.AGMARKNET,
        });
      }
    }
  }

  await prisma.mandiPrice.createMany({ data: mandiPricesToCreate });
  console.log(`✅ Seeded Mandi Prices: ${mandiPricesToCreate.length} price records`);

  // 6. Seed Sample Crop Lots
  const tomatoId = cropMap.get('Tomato')!;
  const onionId = cropMap.get('Onion')!;
  const wheatId = cropMap.get('Wheat')!;

  const lot1 = await prisma.cropLot.create({
    data: {
      farmerId: ramesh.id,
      cropId: tomatoId,
      quantity: 100,
      unit: 'QUINTAL',
      expectedPrice: 2200,
      qualityGrade: QualityGrade.GRADE_A,
      location: 'Village Pimpalgaon, Niphad, Nashik',
      status: CropLotStatus.BIDDING,
    },
  });

  const lot2 = await prisma.cropLot.create({
    data: {
      farmerId: ramesh.id,
      cropId: onionId,
      quantity: 150,
      unit: 'QUINTAL',
      expectedPrice: 1900,
      qualityGrade: QualityGrade.GRADE_A,
      location: 'Village Pimpalgaon, Niphad, Nashik',
      status: CropLotStatus.OPEN,
    },
  });

  const lot3 = await prisma.cropLot.create({
    data: {
      farmerId: gurpreet.id,
      cropId: wheatId,
      quantity: 200,
      unit: 'QUINTAL',
      expectedPrice: 2450,
      qualityGrade: QualityGrade.GRADE_A,
      location: 'Samrala Road, Khanna, Ludhiana',
      status: CropLotStatus.SOLD,
    },
  });

  console.log(`✅ Seeded Crop Lots: 3 crop lots created`);

  // 7. Seed Sample Bids
  const bid1 = await prisma.bid.create({
    data: {
      lotId: lot1.id,
      buyerId: freshCart.id,
      price: 2250,
      quantity: 100,
      message: 'Can pick up within 24 hours directly from farm gate.',
      status: BidStatus.PENDING,
    },
  });

  const bid2 = await prisma.bid.create({
    data: {
      lotId: lot1.id,
      buyerId: greenSpire.id,
      price: 2180,
      quantity: 100,
      message: 'Quality Grade A batch requirement.',
      status: BidStatus.PENDING,
    },
  });

  const bid3 = await prisma.bid.create({
    data: {
      lotId: lot3.id,
      buyerId: greenSpire.id,
      price: 2450,
      quantity: 200,
      message: 'Full consignment bulk purchase.',
      status: BidStatus.ACCEPTED,
    },
  });

  console.log(`✅ Seeded Bids: 3 bids placed`);

  // 8. Seed Completed Transaction & Payment for Lot 3
  const txn = await prisma.transaction.create({
    data: {
      lotId: lot3.id,
      buyerId: greenSpire.id,
      farmerId: gurpreet.id,
      acceptedBidId: bid3.id,
      agreedPrice: 2450,
      quantity: 200,
      totalAmount: 490000,
      status: TransactionStatus.COMPLETED,
    },
  });

  await prisma.payment.create({
    data: {
      transactionId: txn.id,
      amount: 490000,
      status: PaymentStatus.PAID,
      paymentReference: 'UPI-VANIJYA-2024-001',
    },
  });

  // 9. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: ramesh.id,
        action: AuditAction.REGISTRATION_SUBMITTED,
        metadata: JSON.stringify({ role: 'FARMER', state: 'Maharashtra', district: 'Nashik' }),
      },
      {
        actorId: adminUser.id,
        targetUserId: ramesh.id,
        action: AuditAction.REGISTRATION_APPROVED,
        metadata: JSON.stringify({ role: 'FARMER', approvedBy: 'Vanijya Admin' }),
      },
      {
        actorId: ramesh.id,
        lotId: lot1.id,
        action: AuditAction.LOT_CREATED,
        newQuantity: 100,
        price: 2200,
        newStatus: CropLotStatus.OPEN,
      },
      {
        actorId: freshCart.id,
        lotId: lot1.id,
        bidId: bid1.id,
        action: AuditAction.BID_PLACED,
        newQuantity: 100,
        price: 2250,
        newStatus: BidStatus.PENDING,
      },
    ],
  });

  console.log(`✅ Seeded Audit Logs & Platform History`);
  console.log('🎉 Vanijya Agricultural Database Seeding Complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
