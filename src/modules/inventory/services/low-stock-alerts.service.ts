import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { UpdateAlertConfigDto } from '../dto/inventory-extended.dto';

@Injectable()
export class LowStockAlertsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async getConfig(branchId: string) {
    let config = await this.prisma.inventoryAlertConfig.findUnique({
      where: { branchId },
    });

    if (!config) {
      config = await this.prisma.inventoryAlertConfig.create({
        data: {
          branchId,
          emailRecipients: [],
          notifyInApp: true,
        },
      });
    }

    return config;
  }

  async updateConfig(branchId: string, dto: UpdateAlertConfigDto) {
    return await this.prisma.inventoryAlertConfig.upsert({
      where: { branchId },
      update: {
        emailRecipients: dto.emailRecipients,
        notifyInApp: dto.notifyInApp,
      },
      create: {
        branchId,
        emailRecipients: dto.emailRecipients,
        notifyInApp: dto.notifyInApp,
      },
    });
  }

  async getLowStockItems(branchId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { branchId, deletedAt: null },
      include: { category: { select: { name: true } } },
    });

    return items.filter(item => item.quantity <= item.minThreshold);
  }
}
