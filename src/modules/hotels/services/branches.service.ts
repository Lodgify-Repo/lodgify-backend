import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { GeocodingService } from '@/infra/geocoding/geocoding.service';
import { CreateBranchDto, UpdateBranchDto } from '../dto/hotels.dto';
import { DomainError } from '@/common/domain/error';
import { HotelErrorCodes } from '../errors';
import { Prisma } from '@prisma/client';

@Injectable()
export class BranchesService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geocodingService: GeocodingService,
  ) {
    super();
  }

  /**
   * Create a new branch under a hotel (F-H02).
   * If lat/lng are not provided, attempts to geocode the address via Google Maps API.
   */
  async create(hotelId: string, createBranchDto: CreateBranchDto) {
    // Geocode address if coordinates are not provided
    if (!createBranchDto.latitude || !createBranchDto.longitude) {
      const result = await this.geocodingService.geocode(
        createBranchDto.address,
        createBranchDto.city,
        createBranchDto.state,
        createBranchDto.country,
      );

      if (result) {
        createBranchDto.latitude = result.latitude;
        createBranchDto.longitude = result.longitude;
      }
    }

    const { policies, ...rest } = createBranchDto;
    return await this.prisma.branch.create({
      data: {
        ...rest,
        hotelId,
        ...(policies !== undefined && { policies: policies as unknown as Prisma.InputJsonValue }),
      },
    });
  }

  async findAll(hotelId: string) {
    return await this.prisma.branch.findMany({
      where: { hotelId, deletedAt: null },
    });
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch || branch.deletedAt) {
      throw new DomainError(HotelErrorCodes.BRANCH_NOT_FOUND);
    }

    return branch;
  }

  /**
   * Update branch profile (F-H03).
   * Supports editing details, uploading photos, setting amenities, configuring policies,
   * and enabling/disabling food service. Re-geocodes if address fields change.
   */
  async update(id: string, updateBranchDto: UpdateBranchDto) {
    const branch = await this.findOne(id);

    // Re-geocode if any address component changed and no explicit coordinates provided
    const addressChanged =
      (updateBranchDto.address && updateBranchDto.address !== branch.address) ||
      (updateBranchDto.city && updateBranchDto.city !== branch.city) ||
      (updateBranchDto.state && updateBranchDto.state !== branch.state) ||
      (updateBranchDto.country && updateBranchDto.country !== branch.country);

    if (addressChanged && !updateBranchDto.latitude && !updateBranchDto.longitude) {
      const result = await this.geocodingService.geocode(
        updateBranchDto.address ?? branch.address,
        updateBranchDto.city ?? branch.city,
        updateBranchDto.state ?? branch.state,
        updateBranchDto.country ?? branch.country,
      );

      if (result) {
        updateBranchDto.latitude = result.latitude;
        updateBranchDto.longitude = result.longitude;
      }
    }

    const { policies, ...rest } = updateBranchDto;
    return await this.prisma.branch.update({
      where: { id },
      data: {
        ...rest,
        ...(policies !== undefined && { policies: policies as unknown as Prisma.InputJsonValue }),
      },
    });
  }

  /**
   * Temporarily deactivate a branch (F-H05).
   * Removes it from search results while preserving all historical data.
   */
  async deactivate(id: string) {
    const branch = await this.findOne(id);

    if (branch.status === 'DEACTIVATED') {
      throw new DomainError(HotelErrorCodes.BRANCH_ALREADY_DEACTIVATED, 'Branch is already deactivated');
    }

    return await this.prisma.branch.update({
      where: { id },
      data: { status: 'DEACTIVATED' },
    });
  }

  /**
   * Reactivate a previously deactivated branch (F-H05).
   * Returns it to ACTIVE status so it appears in search results again.
   */
  async reactivate(id: string) {
    const branch = await this.findOne(id);

    if (branch.status === 'ACTIVE') {
      throw new DomainError(HotelErrorCodes.BRANCH_ALREADY_ACTIVE, 'Branch is already active');
    }

    return await this.prisma.branch.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });
  }
}
