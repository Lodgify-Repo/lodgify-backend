import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { CacheService } from '@/infra/cache/cache.service';
import { SearchHotelsDto, SearchPropertiesDto, AutocompleteDto } from '../dto/search.dto';
import { Prisma, BookingStatus, RoomStatus } from '@prisma/client';
import { createHash } from 'node:crypto';

const SEARCH_CACHE_TTL = 60;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  if (dist > 1) dist = 1;
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  return dist * 1.609344; // kilometers
}

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
      return this.executeSearchHotels(dto);
    });
  }

  async searchProperties(dto: SearchPropertiesDto) {
    const cacheKey = this.buildPropertiesCacheKey(dto);
    return this.cache.getOrSet(cacheKey, SEARCH_CACHE_TTL, async () => {
      return this.executeSearchProperties(dto);
    });
  }

  async autocomplete(dto: AutocompleteDto) {
    const { query } = dto;
    if (!query || query.length < 2) return { data: [] };

    // Search local DB for entities
    const [hotels, branches, properties] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { name: { contains: query, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5
      }),
      this.prisma.branch.findMany({
        where: { city: { contains: query, mode: 'insensitive' } },
        select: { city: true, state: true, country: true },
        distinct: ['city'],
        take: 5
      }),
      this.prisma.property.findMany({
        where: { title: { contains: query, mode: 'insensitive' } },
        select: { id: true, title: true, type: true },
        take: 5
      })
    ]);

    const results = [
      ...hotels.map(h => ({ type: 'HOTEL', id: h.id, text: h.name })),
      ...branches.map(b => ({ type: 'LOCATION', text: `${b.city}, ${b.state}` })),
      ...properties.map(p => ({ type: 'PROPERTY', id: p.id, text: p.title, propertyType: p.type }))
    ];

    return { data: results };
  }

  private async executeSearchHotels(dto: SearchHotelsDto) {
    const {
      query, checkIn, checkOut, guests, minPrice, maxPrice,
      country, starRating, amenities, latitude, longitude, radius,
      sortBy = 'name', sortOrder = 'asc',
      page = 1, limit = 25,
    } = dto;

    const where: Prisma.BranchWhereInput = {
      status: 'ACTIVE',
    };

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

    if (starRating !== undefined) {
      where.hotel = {
        ...(where.hotel as any),
        starRating: { gte: starRating },
      };
    }

    const roomTypeFilter: Prisma.RoomTypeWhereInput = { };

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

    let bookedRoomIds: string[] = [];
    const hasDateRange = checkIn && checkOut;

    if (hasDateRange) {
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);

      const overlappingBookings = await this.prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.PENDING] },
          roomId: { not: null },
          checkInDate: { lt: checkOutDate },
          checkOutDate: { gt: checkInDate },
        },
        select: { roomId: true },
      });

      bookedRoomIds = overlappingBookings
        .map((b) => b.roomId)
        .filter((id): id is string => id !== null);
    }

    const roomFilter: Prisma.RoomWhereInput = {
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

    const needsInMemoryProcessing = (latitude !== undefined && longitude !== undefined);
    const isDistanceSort = sortBy === 'distance' && needsInMemoryProcessing;
    
    let orderBy: Prisma.BranchOrderByWithRelationInput | undefined;
    if (!isDistanceSort) {
      orderBy = this.buildOrderBy(sortBy, sortOrder);
    }

    let branches = await this.prisma.branch.findMany({
      where,
      ...(needsInMemoryProcessing ? {} : { skip: (page - 1) * limit, take: limit }),
      ...(orderBy ? { orderBy } : {}),
      include: {
        hotel: {
          select: { name: true, logoUrl: true, starRating: true },
        },
        roomTypes: {
          where: {
            ...roomTypeFilter,
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
    });

    let total = needsInMemoryProcessing ? 0 : await this.prisma.branch.count({ where });

    let enrichedData = branches.map((branch) => {
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

      const distance = needsInMemoryProcessing ? calculateDistance(latitude as number, longitude as number, branch.latitude || 0, branch.longitude || 0) : undefined;

      return {
        id: branch.id,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        state: branch.state,
        country: branch.country,
        latitude: branch.latitude,
        longitude: branch.longitude,
        distance,
        contactEmail: branch.contactEmail,
        contactPhone: branch.contactPhone,
        hotel: branch.hotel,
        roomTypes: enrichedRoomTypes,
        availableRoomTypes: enrichedRoomTypes.length,
        totalAvailableRooms: enrichedRoomTypes.reduce((sum, rt) => sum + rt.availableRooms, 0),
        lowestPrice,
      };
    });

    if (needsInMemoryProcessing) {
      if (radius !== undefined) {
        enrichedData = enrichedData.filter(b => b.distance !== undefined && b.distance <= radius);
      }
      if (sortBy === 'distance') {
        enrichedData.sort((a, b) => {
          const d1 = a.distance ?? Infinity;
          const d2 = b.distance ?? Infinity;
          return sortOrder === 'asc' ? d1 - d2 : d2 - d1;
        });
      }
      total = enrichedData.length;
      enrichedData = enrichedData.slice((page - 1) * limit, page * limit);
    }

    return {
      data: enrichedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async executeSearchProperties(dto: SearchPropertiesDto) {
    const {
      query, type, listingType, bedrooms, minPrice, maxPrice,
      amenities, latitude, longitude, radius, sortBy = 'name', sortOrder = 'asc',
      page = 1, limit = 25,
    } = dto;

    const where: Prisma.PropertyWhereInput = {
      status: 'AVAILABLE',
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (type) where.type = type;
    if (listingType) where.listingType = listingType;
    if (bedrooms) where.bedrooms = { gte: bedrooms };

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (amenities && amenities.length > 0) {
      where.features = { hasEvery: amenities };
    }

    const needsInMemoryProcessing = (latitude !== undefined && longitude !== undefined);
    const isDistanceSort = sortBy === 'distance' && needsInMemoryProcessing;

    let orderBy: Prisma.PropertyOrderByWithRelationInput | undefined;
    if (!isDistanceSort) {
      orderBy = sortBy === 'price' ? { price: sortOrder } : { title: sortOrder };
    }

    let properties = await this.prisma.property.findMany({
      where,
      ...(needsInMemoryProcessing ? {} : { skip: (page - 1) * limit, take: limit }),
      ...(orderBy ? { orderBy } : {}),
      include: {
        images: true,
        owner: { select: { firstName: true, lastName: true } }
      }
    });

    let total = needsInMemoryProcessing ? 0 : await this.prisma.property.count({ where });

    let enrichedData = properties.map(p => {
      const distance = needsInMemoryProcessing ? calculateDistance(latitude as number, longitude as number, p.latitude || 0, p.longitude || 0) : undefined;
      return {
        ...p,
        distance,
      };
    });

    if (needsInMemoryProcessing) {
      if (radius !== undefined) {
        enrichedData = enrichedData.filter(p => p.distance !== undefined && p.distance <= radius);
      }
      if (sortBy === 'distance') {
        enrichedData.sort((a, b) => {
          const d1 = a.distance ?? Infinity;
          const d2 = b.distance ?? Infinity;
          return sortOrder === 'asc' ? d1 - d2 : d2 - d1;
        });
      }
      total = enrichedData.length;
      enrichedData = enrichedData.slice((page - 1) * limit, page * limit);
    }

    return {
      data: enrichedData,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

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

    return Math.max(0, Math.round(effective * 100) / 100);
  }

  private buildOrderBy(
    sortBy: string,
    sortOrder: 'asc' | 'desc',
  ): Prisma.BranchOrderByWithRelationInput {
    switch (sortBy) {
      case 'price':
        return { roomTypes: { _count: sortOrder } };
      case 'name':
      default:
        return { name: sortOrder };
    }
  }

  private buildCacheKey(dto: SearchHotelsDto): string {
    const normalized = JSON.stringify({
      q: dto.query ?? '',
      ci: dto.checkIn ?? '',
      co: dto.checkOut ?? '',
      g: dto.guests ?? 0,
      min: dto.minPrice ?? 0,
      max: dto.maxPrice ?? 0,
      c: dto.country ?? '',
      sr: dto.starRating ?? 0,
      lat: dto.latitude ?? 0,
      lng: dto.longitude ?? 0,
      r: dto.radius ?? 0,
      a: (dto.amenities ?? []).sort().join(','),
      sb: dto.sortBy ?? 'name',
      so: dto.sortOrder ?? 'asc',
      p: dto.page ?? 1,
      l: dto.limit ?? 25,
    });
    const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    return `search:hotels:${hash}`;
  }

  private buildPropertiesCacheKey(dto: SearchPropertiesDto): string {
    const normalized = JSON.stringify({
      q: dto.query ?? '',
      t: dto.type ?? '',
      lt: dto.listingType ?? '',
      b: dto.bedrooms ?? 0,
      min: dto.minPrice ?? 0,
      max: dto.maxPrice ?? 0,
      lat: dto.latitude ?? 0,
      lng: dto.longitude ?? 0,
      r: dto.radius ?? 0,
      a: (dto.amenities ?? []).sort().join(','),
      sb: dto.sortBy ?? 'name',
      so: dto.sortOrder ?? 'asc',
      p: dto.page ?? 1,
      l: dto.limit ?? 25,
    });
    const hash = createHash('sha256').update(normalized).digest('hex').slice(0, 16);
    return `search:properties:${hash}`;
  }
}
