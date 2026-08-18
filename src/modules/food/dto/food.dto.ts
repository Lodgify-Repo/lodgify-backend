import { IsString, IsNumber, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateMenuItemDto {
  @IsString()
  categoryId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  preparationTime?: number;
}

export class OrderItemDto {
  @IsString()
  menuItemId: string;

  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateFoodOrderDto {
  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsArray()
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  specialNotes?: string;
}
