import { Injectable } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';

@Injectable()
export class GuestMenuService extends Service {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async browseMenu(branchId: string, filters: { categoryId?: string; dietaryTag?: string; search?: string }, guestId?: string) {
    // Get guest dietary preferences for personalized highlighting
    let guestPreferences: string[] = [];
    let guestAllergyNotes: string | null = null;
    if (guestId) {
      const guest = await this.prisma.user.findUnique({
        where: { id: guestId },
        select: { dietaryPreferences: true, allergyNotes: true },
      });
      guestPreferences = guest?.dietaryPreferences || [];
      guestAllergyNotes = guest?.allergyNotes || null;
    }

    // Build filter conditions
    const where: any = {
      category: { branchId, isActive: true },
      deletedAt: null,
      isAvailable: true,
      availability: { not: 'OUT_OF_STOCK' },
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.dietaryTag) {
      where.dietaryTags = { has: filters.dietaryTag };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, availableFrom: true, availableTo: true } },
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
    });

    // Check for active daily specials
    const now = new Date();
    const activeSpecials = await this.prisma.dailySpecial.findMany({
      where: {
        branchId,
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
      },
    });
    const specialsMap = new Map(activeSpecials.map(s => [s.menuItemId, s]));

    // Enhance items with dietary safety and specials
    const enhancedItems = items.map(item => {
      const special = specialsMap.get(item.id);
      const isSafeForGuest = guestPreferences.length > 0
        ? guestPreferences.every(pref => {
            // If the preference is a restriction/allergy, check it's NOT in the item tags
            // If it's a dietary choice, check it IS in the item tags
            const isAllergy = pref.toLowerCase().includes('allergy');
            return isAllergy
              ? !item.dietaryTags.some(tag => tag.toLowerCase().includes(pref.replace('-allergy', '').toLowerCase()))
              : item.dietaryTags.includes(pref);
          })
        : null;

      return {
        ...item,
        displayPrice: special ? special.promotionalPrice : item.price,
        isOnSpecial: !!special,
        specialDescription: special?.description || null,
        originalPrice: special ? item.price : null,
        isSafeForGuest,
      };
    });

    return {
      items: enhancedItems,
      guestDietaryPreferences: guestPreferences,
      guestAllergyNotes: guestAllergyNotes,
    };
  }

  async updateDietaryPreferences(guestId: string, dietaryPreferences: string[], allergyNotes?: string) {
    return await this.prisma.user.update({
      where: { id: guestId },
      data: {
        dietaryPreferences,
        allergyNotes: allergyNotes ?? undefined,
      },
      select: { dietaryPreferences: true, allergyNotes: true },
    });
  }

  async getDietaryPreferences(guestId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: guestId },
      select: { dietaryPreferences: true, allergyNotes: true },
    });
    return user || { dietaryPreferences: [], allergyNotes: null };
  }
}
