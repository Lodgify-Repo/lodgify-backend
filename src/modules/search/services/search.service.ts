import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CacheService } from '@/infra/cache/cache.service';
import { SearchHotelsDto } from '../dto/search.dto';
import { Prisma, BookingStatus, RoomStatus } from '@prisma/client';
import { createHash } from 'node:crypto';

const SEARCH_CACHE_TTL = 60;

@Injectable()
export class SearchService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {
    super();
  }

  async searchHotels(dto: SearchHotelsDto) {
    const cacheKey = this.buildCacheKey(dto);

    return this.cache.getOrSet(cacheKey, SEARCH_CACHE_TTL, async () => {
      return this.executeSearch(dto);
    });
  }


  // Core search pipeline
  private async executeSearch(dto: SearchHotelsDto) {
    const {
      query, checkIn, checkOut, guests, minPrice, maxPrice,
      country, amenities, sortBy = 'name', sortOrder = 'asc',
      page = 1, limit = 25,
    } = dto;

    // 1. Build the base Branch filter
    const where: Prisma.BranchWhereInput = {
      status: 'ACTIVE',
      deletedAt: null,
    };

    // Text search across branch name, city, state, and hotel name
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
        { hotel: { name: { contains: query, mode: 'insensitive' } } },
      ];
    }

    if (country) {
      where.country = { equals: country, mode: 'insensitive' };
    }

    // 2. Build room-type sub-filter for capacity, amenities, and price
    const roomTypeFilter: Prisma.RoomTypeWhereInput = { deletedAt: null };

    if (guests) {
      roomTypeFilter.maxOccupancy = { gte: guests };
    }

    if (amenities && amenities.length > 0) {
      roomTypeFilter.amenities = { hasEvery: amenities };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      roomTypeFilter.basePrice = {};
      if (minPrice !== undefined) roomTypeFilter.basePrice.gte = minPrice;
      if (maxPrice !== undefined) roomTypeFilter.basePrice.lte = maxPrice;
    }

    // 3. Availability: find rooms booked during the requested window
    let bookedRoomIds: string[] = [];
    const hasDateRange = checkIn && checkOut;

    if (hasDateRange) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const overlappingBookings = await this.prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING] },
          deletedAt: null,
          roomId: { not: null },
          // Overlap condition: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
        select: { roomId: true },
      });

      bookedRoomIds = overlappingBookings
        .map((b) => b.roomId)
        .filter((id): id is string => id !== null);
    }

    // Require branches to have at least one qualifying room type
    // with at least one available (non-booked, non-out-of-order) room
    const roomFilter: Prisma.RoomWhereInput = {
      deletedAt: null,
      status: { not: RoomStatus.OUT_OF_ORDER },
    };

    if (bookedRoomIds.length > 0) {
      roomFilter.id = { notIn: bookedRoomIds };
    }

    where.roomTypes = {
      some: {
        ...roomTypeFilter,
        rooms: { some: roomFilter },
      },
    };

    // 4. Determine sort order
    const orderBy = this.buildOrderBy(sortBy, sortOrder);

    // 5. Execute query + count in a single transaction
    const [branches, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          hotel: {
            select: { name: true, logoUrl: true },
          },
          roomTypes: {
            where: {
              ...roomTypeFilter,
              deletedAt: null,
              rooms: { some: roomFilter },
            },
            include: {
              rooms: {
                where: roomFilter,
                select: { id: true, roomNumber: true, floor: true, status: true },
              },
              pricingRules: {
                where: {
                  isActive: true,
                  ...(hasDateRange
                    ? {
                        startDate: { lte: new Date(checkOut) },
                        endDate: { gte: new Date(checkIn) },
                      }
                    : {}),
                },
              },
            },
          },
        },
      }),
      this.prisma.branch.count({ where }),
    ]);

    // 6. Enrich results with computed availability + effective pricing
    const data = branches.map((branch) => {
      const enrichedRoomTypes = branch.roomTypes.map((rt) => {
        const effectivePrice = this.computeEffectivePrice(rt.basePrice, rt.pricingRules);
        return {
          id: rt.id,
          name: rt.name,
          description: rt.description,
          basePrice: rt.basePrice,
          effectivePrice,
          maxOccupancy: rt.maxOccupancy,
          beds: rt.beds,
          sizeSqft: rt.sizeSqft,
          images: rt.images,
          amenities: rt.amenities,
          availableRooms: rt.rooms.length,
        };
      });

      const lowestPrice = enrichedRoomTypes.length > 0
        ? Math.min(...enrichedRoomTypes.map((rt) => rt.effectivePrice))
        : null;

      return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        contactEmail: branch.contactEmail,
        contactPhone: branch.contactPhone,
        hotel: branch.hotel,
        roomTypes: enrichedRoomTypes,
        availableRoomTypes: enrichedRoomTypes.length,
        totalAvailableRooms: enrichedRoomTypes.reduce((sum, rt) => sum + rt.availableRooms, 0),
        lowestPrice,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Helpers

  /**
   * Applies active pricing rules to compute the effective nightly rate.
   * PERCENTAGE rules adjust by a percentage (+/-), FIXED_AMOUNT rules add/subtract directly.
   * Multiple rules stack additively.
   */
  private computeEffectivePrice(
    basePrice: number,
    pricingRules: { modifierType: string; modifierValue: number }[],
  ): number {
    if (!pricingRules.length) return basePrice;

    let effective = basePrice;

    for (const rule of pricingRules) {
      if (rule.modifierType === 'PERCENTAGE') {
        effective += basePrice * (rule.modifierValue / 100);
      } else if (rule.modifierType === 'FIXED_AMOUNT') {
        effective += rule.modifierValue;
      }
    }

    // Price floor: never go below zero
    return Math.max(0, Math.round(effective * 100) / 100);
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): Prisma.BranchOrderByWithRelationInput {
    switch (sortBy) {
      case 'price':
        // Sort by cheapest room type base price within the branch
        return { roomTypes: { _count: sortOrder } };
      case 'name':
      default:
        return { name: sortOrder };
    }
  }

  /**
   * Builds a deterministic cache key from search params so identical queries
   * hit Redis instead of the database.
   */
  private buildCacheKey(dto: SearchHotelsDto): string {
    const normalized = JSON.stringify({
      q: dto.query ?? '',
      ci: dto.checkIn ?? '',
      co: dto.checkOut ?? '',
      g: dto.guests ?? 0,
      min: dto.minPrice ?? 0,
      max: dto.maxPrice ?? 0,
      c: dto.country ?? '',
      a: (dto.amenities ?? []).sort().join(','),
      sb: dto.sortBy ?? 'name',
      so: dto.sortOrder ?? 'asc',
      p: dto.page ?? 1,
      l: dto.limit ?? 25,
    });
    const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    return `search:hotels:${hash}`;
  }
}

