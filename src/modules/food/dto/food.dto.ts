import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';
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

  @ApiPropertyOptional({ description: 'Image URL', example: 'https://storage.example.com/food/jollof.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Preparation time in minutes', example: 25 })
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

  @ApiProperty({ description: 'Ordered items', type: [OrderItemDto] })
  @IsArray()
  items: OrderItemDto[];

  @ApiPropertyOptional({ description: 'Special notes for the entire order', example: 'No peanuts please' })
  @IsOptional()
  @IsString()
  specialNotes?: string;
}
