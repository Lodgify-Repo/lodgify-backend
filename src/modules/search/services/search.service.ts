import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { SearchHotelsDto } from '../dto/search.dto';

@Injectable()
export class SearchService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async searchHotels(searchDto: SearchHotelsDto) {
    const { query, checkIn, checkOut, guests, minPrice, maxPrice, page = 1, limit = 25 } = searchDto;
    
    // Simplistic search implementation
    const where: any = { status: 'ACTIVE', ...this.commonQueries.notDeleted };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ];
    }

    // A real implementation would check room availability against checkIn/checkOut
    const branches = await this.prisma.branch.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        hotel: {
          select: { name: true, logoUrl: true }
        },
        roomTypes: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            images: true,
          }
        }
      }
    });

    const total = await this.prisma.branch.count({ where });

    return {
      data: branches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
