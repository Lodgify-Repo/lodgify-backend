export interface AppEvents {
  'booking:confirmed': { bookingId: string; hotelId: string };
  'booking:cancelled': { bookingId: string; reason?: string };
  'room:status_changed': { roomId: string; status: string };
  'room:cleaned': { roomId: string; branchId: string; roomTypeId: string; userId: string };
  'payment:received': { reference: string; amount: number; bookingId: string };
  'food_order:created': { orderId: string };
  'food_order:status_changed': { orderId: string; status: string };
  'inventory:stock_updated': { itemId: string; newStock: number; reorderThreshold: number };
  'inventory:low_stock': { itemId: string; currentQuantity: number };
  'property:inquiry': { inquiryId: string };
  'property:viewing_requested': { viewingId: string };
  'property:offer_submitted': { offerId: string };
  'offer:received': { offerId: string; propertyId: string };
  'offer:responded': { offerId: string; status: string };
  'agent_auth:granted': { agentEmail: string; agentName: string; propertyName: string };
  'agent_auth:revoked': { agentEmail: string; agentName: string; propertyName: string };
  'commission:earned': { agentEmail: string; agentName: string; amount: number; reference: string };
  'property_booking:created': { bookingId: string; propertyId: string; guestId: string; ownerId: string; isInstant: boolean };
  'property_booking:accepted': { bookingId: string; guestId: string; ownerId: string };
  'property_booking:declined': { bookingId: string; guestId: string; ownerId: string };
  'property_message:received': { messageId: string; propertyId: string; senderId: string; receiverId: string; content: string };
  'property:updated': { propertyId: string };
  'property_sale:milestone_updated': { milestoneId: string; offerId: string; status: string };
}
