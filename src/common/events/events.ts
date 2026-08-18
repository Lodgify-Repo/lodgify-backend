export interface AppEvents {
  'booking:confirmed': { bookingId: string; hotelId: string };
  'booking:cancelled': { bookingId: string; reason?: string };
  'room:status_changed': { roomId: string; status: string };
  'payment:received': { reference: string; amount: number; bookingId: string };
  'food_order:new': { orderId: string; hotelId: string };
  'food_order:status_updated': { orderId: string; status: string };
  'inventory:low_stock': { itemId: string; currentQuantity: number };
  'property:inquiry': { propertyId: string; inquiryId: string };
  'offer:received': { offerId: string; propertyId: string };
  'offer:responded': { offerId: string; status: string };
  'agent:authorized': { agentId: string; propertyId: string };
  'commission:confirmed': { commissionId: string; agentId: string };
}
