import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Get, Body, UseGuards, Param, Delete } from '@nestjs/common';
import { RoomInventoryLinksService } from '../services/room-inventory-links.service';
import { CreateRoomInventoryLinkDto } from '../dto/inventory-extended.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Room Inventory Links')
@ApiBearerAuth('access-token')
@Controller('inventory/room-types/:roomTypeId/links')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RoomInventoryLinksController {
  constructor(private readonly linksService: RoomInventoryLinksService) {}

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Post()
  @ApiOperation({ summary: 'F-I12: Associate inventory item with room type' })
  async createLink(@Param('roomTypeId') roomTypeId: string, @Body() dto: CreateRoomInventoryLinkDto) {
    dto.roomTypeId = roomTypeId;
    return this.linksService.createLink(dto);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER, Role.HOUSEKEEPING)
  @Get()
  @ApiOperation({ summary: 'F-I12: Get inventory items for room type' })
  async getLinks(@Param('roomTypeId') roomTypeId: string) {
    return this.linksService.getLinks(roomTypeId);
  }

  @Roles(Role.HOTEL_OWNER, Role.BRANCH_MANAGER)
  @Delete(':itemId')
  @ApiOperation({ summary: 'F-I12: Remove inventory item association' })
  async removeLink(@Param('roomTypeId') roomTypeId: string, @Param('itemId') itemId: string) {
    return this.linksService.removeLink(roomTypeId, itemId);
  }
}
