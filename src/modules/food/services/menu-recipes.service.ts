import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Service } from '@/common/domain/base.service';
import { PrismaService } from '@/infra/database/prisma.service';
import { SetMenuItemRecipeDto } from '../dto/food-extended.dto';
import { InventoryTransactionsService } from '@/modules/inventory/services/inventory-transactions.service';

@Injectable()
export class MenuRecipesService extends Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryTransactionsService: InventoryTransactionsService,
  ) {
    super();
  }

  // Set/replace the recipe (ingredient list) for a menu item
  async setRecipe(menuItemId: string, dto: SetMenuItemRecipeDto) {
    const menuItem = await this.prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!menuItem || menuItem.deletedAt) throw new NotFoundException('Menu item not found');

    // Delete existing recipe entries
    await this.prisma.menuItemRecipe.deleteMany({ where: { menuItemId } });

    // Create new recipe entries
    const recipes = await Promise.all(
      dto.ingredients.map(ingredient =>
        this.prisma.menuItemRecipe.create({
          data: {
            menuItemId,
            inventoryItemId: ingredient.inventoryItemId,
            quantityNeeded: ingredient.quantityNeeded,
          },
          include: { inventoryItem: { select: { name: true, unit: true } } },
        })
      )
    );

    return { menuItemId, ingredients: recipes };
  }

  // Get the recipe for a menu item
  async getRecipe(menuItemId: string) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: {
        recipe: {
          include: { inventoryItem: { select: { name: true, unit: true, quantity: true } } },
        },
      },
    });
    if (!menuItem || menuItem.deletedAt) throw new NotFoundException('Menu item not found');

    return {
      menuItemId,
      menuItemName: menuItem.name,
      ingredients: menuItem.recipe,
    };
  }

  // Check if all ingredients are available for a menu item (used before ordering)
  async checkAvailability(menuItemId: string, quantity: number = 1): Promise<{ available: boolean; insufficientItems: string[] }> {
    const recipe = await this.prisma.menuItemRecipe.findMany({
      where: { menuItemId },
      include: { inventoryItem: { select: { name: true, quantity: true } } },
    });

    if (recipe.length === 0) return { available: true, insufficientItems: [] };

    const insufficientItems: string[] = [];
    for (const ingredient of recipe) {
      const needed = ingredient.quantityNeeded * quantity;
      if (ingredient.inventoryItem.quantity < needed) {
        insufficientItems.push(ingredient.inventoryItem.name);
      }
    }

    return {
      available: insufficientItems.length === 0,
      insufficientItems,
    };
  }

  // Auto-deduct ingredients from inventory when an order is placed
  // Uses InventoryTransactionsService for consistency with stock tracking, low-stock alerts, etc.
  async deductIngredientsForOrder(orderId: string, userId: string) {
    const order = await this.prisma.foodOrder.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: {
              include: { recipe: true },
            },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');

    for (const orderItem of order.items) {
      for (const ingredient of orderItem.menuItem.recipe) {
        const totalNeeded = ingredient.quantityNeeded * orderItem.quantity;

        try {
          await this.inventoryTransactionsService.recordTransaction(
            ingredient.inventoryItemId,
            userId,
            {
              type: 'OUT',
              quantity: totalNeeded,
              remarks: `Auto-deducted for Food Order ${orderId} (${orderItem.quantity}x ${orderItem.menuItem.name})`,
              foodOrderId: orderId,
            },
          );
        } catch (error) {
          this.logger.warn(`Failed to deduct ingredient ${ingredient.inventoryItemId} for order ${orderId}: ${error.message}`);
          // Mark the menu item as unavailable if stock is insufficient
          if (error.code === 'INSUFFICIENT_STOCK') {
            await this.prisma.menuItem.update({
              where: { id: orderItem.menuItemId },
              data: { availability: 'OUT_OF_STOCK', isAvailable: false },
            });
          }
        }
      }
    }
  }
}
