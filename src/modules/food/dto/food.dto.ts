import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMenuItemDto {
  @ApiProperty({ description: 'Food category ID', example: 'clxyz123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ description: 'Menu item name', example: 'Jollof Rice with Chicken' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Item description', example: 'Smoky party-style jollof rice with grilled chicken' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Price in the base currency', example: 3500 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Primary image URL', example: 'https://storage.example.com/food/jollof.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional photo URLs', example: ['url1.jpg', 'url2.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Dietary tags', example: ['vegetarian', 'gluten-free'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[];

  @ApiPropertyOptional({ description: 'Item availability status', example: 'IN_STOCK', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'SEASONAL'] })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ description: 'Preparation time in minutes', example: 25 })
  @IsOptional()
  @IsNumber()
  preparationTime?: number;
}

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ description: 'Menu item name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Price in the base currency' })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Primary image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Additional photo URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Dietary tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryTags?: string[];

  @ApiPropertyOptional({ description: 'Item availability status', enum: ['IN_STOCK', 'OUT_OF_STOCK', 'SEASONAL'] })
  @IsOptional()
  @IsString()
  availability?: string;

  @ApiPropertyOptional({ description: 'Is item available' })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Preparation time in minutes' })
  @IsOptional()
  @IsNumber()
  preparationTime?: number;
}

export class OrderItemDto {
  @ApiProperty({ description: 'Menu item ID', example: 'clxyz456' })
  @IsString()
  menuItemId: string;

  @ApiProperty({ description: 'Quantity ordered', example: 2 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'Special notes for this item', example: 'Extra spicy' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFoodOrderDto {
  @ApiPropertyOptional({ description: 'Associated booking ID (for room service)', example: 'clxyz789' })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Table number (for dine-in)', example: 'T12' })
  @IsOptional()
  @IsString()
  tableNumber?: string;

  @ApiPropertyOptional({ description: 'Room number (auto-filled from booking)', example: '301A' })
  @IsOptional()
  @IsString()
  roomNumber?: string;

  @ApiPropertyOptional({ description: 'Delivery type', example: 'ASAP', enum: ['ASAP', 'SCHEDULED'] })
  @IsOptional()
  @IsString()
  deliveryType?: string;

  @ApiPropertyOptional({ description: 'Scheduled delivery time (ISO 8601)', example: '2026-08-28T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledTime?: string;

  @ApiPropertyOptional({ description: 'Payment method', example: 'BILL_TO_ROOM', enum: ['PAYSTACK', 'BILL_TO_ROOM'] })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Ordered items', type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Special notes for the entire order', example: 'No peanuts please — allergy' })
  @IsOptional()
  @IsString()
  specialNotes?: string;
}
