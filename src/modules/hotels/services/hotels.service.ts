import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CreateHotelDto, UpdateHotelDto } from '../dto/hotels.dto';
import { DomainError } from '@/common/domain/error';
import { HotelErrorCodes } from '../errors';

@Injectable()
export class HotelsService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  /**
   * Register a new hotel (F-H01).
   * The hotel is created with status PENDING and requires admin approval before it becomes active.
   */
  async create(ownerId: string, createHotelDto: CreateHotelDto) {
    const existing = await this.prisma.hotel.findUnique({
      where: { ownerId },
    });

    if (existing) {
      throw new DomainError(HotelErrorCodes.HOTEL_ALREADY_EXISTS, 'User already owns a hotel');
    }

    const hotel = await this.prisma.hotel.create({
      data: {
        ...createHotelDto,
        ownerId,
        status: 'PENDING', // Requires admin approval (F-H04)
      },
    });

    this.logger.info(`Hotel "${hotel.name}" registered by owner ${ownerId} — awaiting admin approval`);

    return hotel;
  }

  async findByOwner(ownerId: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { ownerId },
      include: { branches: true },
    });

    if (!hotel) {
      throw new DomainError(HotelErrorCodes.HOTEL_NOT_FOUND);
    }

    return hotel;
  }

  /**
   * Find a hotel by its ID. Used by admin verification flow and other modules.
   */
  async findById(id: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id },
      include: {
        branches: true,
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true, phone: true },
        },
      },
    });

    if (!hotel) {
      throw new DomainError(HotelErrorCodes.HOTEL_NOT_FOUND);
    }

    return hotel;
  }

  async update(ownerId: string, updateHotelDto: UpdateHotelDto) {
    const hotel = await this.findByOwner(ownerId);
    return await this.prisma.hotel.update({
      where: { id: hotel.id },
      data: updateHotelDto,
    });
  }
}
