import { Injectable, NotFoundException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateRoomInventoryLinkDto } from '../dto/inventory-extended.dto';

@Injectable()
export class RoomInventoryLinksService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createLink(dto: CreateRoomInventoryLinkDto) {
    return await this.prisma.roomTypeInventoryLink.upsert({
      where: {
        roomTypeId_itemId: { roomTypeId: dto.roomTypeId, itemId: dto.itemId }
      },
      update: { quantityPerClean: dto.quantityPerClean },
      create: {
        roomTypeId: dto.roomTypeId,
        itemId: dto.itemId,
        quantityPerClean: dto.quantityPerClean,
      }
    });
  }

  async getLinks(roomTypeId: string) {
    return await this.prisma.roomTypeInventoryLink.findMany({
      where: { roomTypeId },
      include: {
        item: { select: { name: true, unit: true, quantity: true } }
      }
    });
  }

  async removeLink(roomTypeId: string, itemId: string) {
    const exists = await this.prisma.roomTypeInventoryLink.findUnique({
      where: { roomTypeId_itemId: { roomTypeId, itemId } }
    });

    if (!exists) throw new NotFoundException('Link not found');

    return await this.prisma.roomTypeInventoryLink.delete({
      where: { roomTypeId_itemId: { roomTypeId, itemId } }
    });
  }
}
