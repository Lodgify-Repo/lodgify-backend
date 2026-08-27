import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreatePurchaseOrderDto, UpdatePOStatusDto } from '../dto/inventory-extended.dto';
import { POStatus } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createPO(branchId: string, dto: CreatePurchaseOrderDto) {
    let totalAmount = 0;
    const poItems = dto.items.map(item => {
      const total = item.quantity * item.unitPrice;
      totalAmount += total;
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total,
      };
    });

    return await this.prisma.purchaseOrder.create({
      data: {
        branchId,
        supplierId: dto.supplierId,
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        totalAmount,
        items: {
          create: poItems,
        },
      },
      include: { items: true },
    });
  }

  async getPOs(branchId: string) {
    return await this.prisma.purchaseOrder.findMany({
      where: { branchId },
      include: {
        supplier: { select: { name: true, contactName: true } },
        items: { include: { item: { select: { name: true, unit: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(poId: string, dto: UpdatePOStatusDto, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) throw new NotFoundException('PO not found');

    return await this.prisma.$transaction(async (tx) => {
      const updated = await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: dto.status as POStatus },
      });

      // If marked fulfilled, auto-receive inventory items
      if (dto.status === 'FULFILLED' && po.status !== 'FULFILLED') {
        for (const item of po.items) {
          await tx.inventoryTransaction.create({
            data: {
              itemId: item.itemId,
              type: 'IN',
              quantity: item.quantity,
              remarks: `PO ${poId} Fulfilled`,
              userId,
              purchaseOrderId: poId,
            }
          });

          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }

      return updated;
    });
  }
}
