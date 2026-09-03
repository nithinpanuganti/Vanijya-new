import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { TransactionsService } from '../transactions/transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Command & Monitoring')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly transactionsService: TransactionsService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get unified marketplace KPI statistics and overview metrics' })
  @ApiResponse({ status: 200, description: 'Admin statistics returned' })
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('registrations')
  @ApiOperation({ summary: 'Get all pending/approved/rejected registration requests with filters' })
  @ApiResponse({ status: 200, description: 'List of registrations returned' })
  getRegistrations(@Query() query: any) {
    return this.adminService.getRegistrations(query);
  }

  @Get('registrations/:id')
  @ApiOperation({ summary: 'Get detailed application for a specific registration request' })
  @ApiResponse({ status: 200, description: 'Registration detail returned' })
  getRegistrationById(@Param('id') id: string) {
    return this.adminService.getRegistrationById(id);
  }

  @Patch('users/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a farmer or buyer registration' })
  @ApiResponse({ status: 200, description: 'User successfully approved' })
  approveUser(@Param('id') id: string, @CurrentUser() adminUser: any) {
    return this.adminService.approveUser(id, adminUser);
  }

  @Patch('registrations/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a farmer or buyer registration' })
  @ApiResponse({ status: 200, description: 'User successfully approved' })
  approveRegistration(@Param('id') id: string, @CurrentUser() adminUser: any) {
    return this.adminService.approveUser(id, adminUser);
  }

  @Patch('users/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a farmer or buyer registration with a reason' })
  @ApiResponse({ status: 200, description: 'User successfully rejected' })
  rejectUser(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('reason') reason: string,
    @CurrentUser() adminUser: any,
  ) {
    const finalReason = rejectionReason || reason || '';
    return this.adminService.rejectUser(id, finalReason, adminUser);
  }

  @Patch('registrations/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a farmer or buyer registration with a reason' })
  @ApiResponse({ status: 200, description: 'User successfully rejected' })
  rejectRegistration(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
    @Body('reason') reason: string,
    @CurrentUser() adminUser: any,
  ) {
    const finalReason = rejectionReason || reason || '';
    return this.adminService.rejectUser(id, finalReason, adminUser);
  }

  @Get('lots')
  @ApiOperation({ summary: 'Monitor all crop lots with filters (crop, status, farmer)' })
  @ApiResponse({ status: 200, description: 'All lots returned for admin inspection' })
  getLots(@Query() query: any) {
    return this.adminService.getAllLots(query);
  }

  @Get('bids')
  @ApiOperation({ summary: 'Monitor all bidding activity with status filters' })
  @ApiResponse({ status: 200, description: 'All bids returned for admin inspection' })
  getBids(@Query() query: any) {
    return this.adminService.getAllBids(query);
  }

  @Get('users')
  @ApiOperation({ summary: 'Monitor farmer and buyer directories with volume statistics' })
  @ApiResponse({ status: 200, description: 'Users directory returned' })
  getUsers() {
    return this.adminService.getUsers();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Monitor all transactions and purchase contracts' })
  @ApiResponse({ status: 200, description: 'All transactions returned' })
  getTransactions(@CurrentUser('id') userId: string, @CurrentUser('role') role: Role) {
    return this.transactionsService.findAll(userId, role);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get real-time audit activity feed' })
  @ApiResponse({ status: 200, description: 'Live audit log returned' })
  getActivity(@Query('limit') limit?: number) {
    return this.adminService.getActivityFeed(limit ? Number(limit) : 50);
  }
}
