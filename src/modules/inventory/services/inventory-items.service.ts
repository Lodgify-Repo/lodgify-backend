import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateInventoryItemDto } from '../dto/inventory.dto';
import { CreateStorageLocationDto } from '../dto/inventory-extended.dto';

@Injectable()
export class InventoryItemsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  // -----------------------------------------
  // F-I02 Item Master Data
  // -----------------------------------------
  async createItem(branchId: string, dto: CreateInventoryItemDto) {
    return await this.prisma.inventoryItem.create({
      data: {
        branchId,
        categoryId: dto.categoryId,
        name: dto.name,
        sku: dto.sku,
        barcode: dto.barcode,
        defaultSupplierId: dto.defaultSupplierId,
        photos: dto.photos || [],
        unit: dto.unit,
        minThreshold: dto.minThreshold,
        reorderQuantity: dto.reorderQuantity,
        costPerUnit: dto.costPerUnit,
      },
    });
  }

  async getItemsByBranch(branchId: string) {
    return await this.prisma.inventoryItem.findMany({
      where: { branchId },
      include: { 
        category: true,
        balances: {
          include: { location: true }
        },
        defaultSupplier: { select: { id: true, name: true } }
      },
    });
  }

  async updateItem(id: string, dto: Partial<CreateInventoryItemDto>) {
    const item = await this.prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');

    return await this.prisma.inventoryItem.update({
      where: { id },
      data: dto,
    });
  }

  // -----------------------------------------
  // F-I03 Storage Locations & Balances
  // -----------------------------------------
  async createLocation(branchId: string, dto: CreateStorageLocationDto) {
    return await this.prisma.storageLocation.create({
      data: {
        branchId,
        name: dto.name,
        type: dto.type,
      },
    });
  }

  async getLocations(branchId: string) {
    return await this.prisma.storageLocation.findMany({
      where: { branchId },
    });
  }

  async getStockBalance(locationId: string, itemId: string) {
    return await this.prisma.stockBalance.findUnique({
      where: {
        locationId_itemId: { locationId, itemId },
      },
    });
  }
}
