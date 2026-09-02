import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LotsService } from './lots.service';
import { CreateCropLotDto, UpdateCropLotDto, QueryLotsDto } from './dto/create-lot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Crop Lots')
@Controller('lots')
export class LotsController {
  constructor(private readonly lotsService: LotsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new crop lot (Farmers only)' })
  @ApiResponse({ status: 201, description: 'Crop lot created and published' })
  @ApiResponse({ status: 403, description: 'Forbidden. Only approved farmers can create lots' })
  create(@CurrentUser() user: any, @Body() dto: CreateCropLotDto) {
    const farmerId = user?.id || user?.sub;
    return this.lotsService.create(farmerId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Browse all crop lots with filters (public / buyers)' })
  @ApiResponse({ status: 200, description: 'List of crop lots returned' })
  findAll(@Query() query: QueryLotsDto) {
    return this.lotsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a crop lot including bids' })
  @ApiResponse({ status: 200, description: 'Lot details returned' })
  @ApiResponse({ status: 404, description: 'Lot not found' })
  findOne(@Param('id') id: string) {
    return this.lotsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit crop lot details (Owner farmer only, while OPEN)' })
  @ApiResponse({ status: 200, description: 'Crop lot updated' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: UpdateCropLotDto,
  ) {
    return this.lotsService.update(id, userId, userRole, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.FARMER, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a crop lot' })
  @ApiResponse({ status: 200, description: 'Crop lot cancelled' })
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.lotsService.cancel(id, userId, userRole);
  }
}
