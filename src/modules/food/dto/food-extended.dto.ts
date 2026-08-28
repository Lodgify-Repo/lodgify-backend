import { IsString, IsNumber, IsOptional, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


// F-F01: Menu Category Management

export class CreateMenuCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Breakfast' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Category description', example: 'Morning meals served 6am - 11am' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Available from time (HH:mm)', example: '06:00' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Available to time (HH:mm)', example: '11:00' })
  @IsOptional()
  @IsString()
  availableTo?: string;

  @ApiPropertyOptional({ description: 'Sort order for display', example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateMenuCategoryDto {
  @ApiPropertyOptional({ description: 'Category name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Category description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Available from time (HH:mm)' })
  @IsOptional()
  @IsString()
  availableFrom?: string;

  @ApiPropertyOptional({ description: 'Available to time (HH:mm)' })
  @IsOptional()
  @IsString()
  availableTo?: string;

  @ApiPropertyOptional({ description: 'Sort order' })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Is category active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


// F-F05 + F-F06: Kitchen & Order Status

export class UpdateOrderStatusDto {
  @ApiProperty({ description: 'New order status', example: 'PREPARING', enum: ['RECEIVED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] })
  @IsString()
  status: string;

  @ApiPropertyOptional({ description: 'Estimated delivery time in minutes', example: 20 })
  @IsOptional()
  @IsNumber()
  estimatedDeliveryTime?: number;
}


// F-F08: Daily Specials & Promotions

export class CreateDailySpecialDto {
  @ApiProperty({ description: 'Menu item ID to promote', example: 'clxyz123' })
  @IsString()
  menuItemId: string;

  @ApiProperty({ description: 'Promotional price', example: 2500 })
  @IsNumber()
  promotionalPrice: number;

  @ApiPropertyOptional({ description: 'Promotion description', example: 'Today only! 30% off our signature Jollof' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '2026-08-28T06:00:00Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ description: 'Expiry time (ISO 8601)', example: '2026-08-28T22:00:00Z' })
  @IsDateString()
  expiresAt: string;
}


// F-F09: Kitchen Inventory Link (Recipes)

export class MenuItemRecipeDto {
  @ApiProperty({ description: 'Inventory item ID (ingredient)', example: 'clxyz456' })
  @IsString()
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity of ingredient needed per serving', example: 0.15 })
  @IsNumber()
  quantityNeeded: number;
}

export class SetMenuItemRecipeDto {
  @ApiProperty({ description: 'List of ingredients and quantities', type: [MenuItemRecipeDto] })
  @IsArray()
  ingredients: MenuItemRecipeDto[];
}


// F-F11: Order History & Reorder

export class ReorderDto {
  @ApiProperty({ description: 'Original order ID to reorder from', example: 'clxyz789' })
  @IsString()
  originalOrderId: string;

  @ApiPropertyOptional({ description: 'Modified items (overrides quantities)', type: 'array' })
  @IsOptional()
  @IsArray()
  modifiedItems?: { menuItemId: string; quantity: number }[];
}


// F-F12: Dietary Preferences

export class UpdateDietaryPreferencesDto {
  @ApiPropertyOptional({ description: 'Dietary preferences', example: ['vegetarian', 'nut-allergy'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences?: string[];

  @ApiPropertyOptional({ description: 'Allergy notes', example: 'Severe peanut allergy' })
  @IsOptional()
  @IsString()
  allergyNotes?: string;
}


// F-F03: Guest Menu Query Filters

export class GuestMenuQueryDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by dietary tag', example: 'vegetarian' })
  @IsOptional()
  @IsString()
  dietaryTag?: string;

  @ApiPropertyOptional({ description: 'Search by item name' })
  @IsOptional()
  @IsString()
  search?: string;
}
