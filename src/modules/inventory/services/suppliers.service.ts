import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateSupplierDto, RateSupplierDto } from '../dto/inventory-extended.dto';

@Injectable()
export class SuppliersService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createSupplier(dto: CreateSupplierDto) {
    return await this.prisma.supplier.create({
      data: dto,
    });
  }

  async getSuppliers() {
    return await this.prisma.supplier.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async getSupplierDetails(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: { ratings: true, purchaseOrders: true },
    });

    if (!supplier) throw new NotFoundException('Supplier not found');

    // Calculate performance
    const totalPos = supplier.purchaseOrders.length;
    const fulfilledPos = supplier.purchaseOrders.filter(po => po.status === 'FULFILLED').length;
    
    let avgRating = 0;
    if (supplier.ratings.length > 0) {
      avgRating = supplier.ratings.reduce((sum, r) => sum + r.rating, 0) / supplier.ratings.length;
    }

    return {
      ...supplier,
      performance: {
        totalPos,
        fulfilledPos,
        fulfillmentRate: totalPos > 0 ? (fulfilledPos / totalPos) * 100 : 0,
        averageRating: avgRating,
      }
    };
  }

  async updateSupplier(id: string, dto: Partial<CreateSupplierDto>) {
    return await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });
  }

  async deleteSupplier(id: string) {
    return await this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async rateSupplier(id: string, userId: string, dto: RateSupplierDto) {
    return await this.prisma.supplierRating.create({
      data: {
        supplierId: id,
        ratedBy: userId,
        rating: dto.rating,
        deliveryRating: dto.deliveryRating,
        qualityRating: dto.qualityRating,
        comment: dto.comment,
      },
    });
  }
}
