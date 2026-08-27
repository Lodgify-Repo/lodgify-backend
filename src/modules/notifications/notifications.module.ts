import { Module } from '@nestjs/common';
import { BookingListener } from './listeners/booking.listener';
import { PaymentListener } from './listeners/payment.listener';
import { ReminderCron } from './crons/reminder.cron';
import { FoodOrderListener } from './listeners/food-order.listener';
import { PropertyListener } from './listeners/property.listener';
import { AgentListener } from './listeners/agent.listener';
import { InventoryListener } from './listeners/inventory.listener';

@Module({
  providers: [
    BookingListener, 
    PaymentListener, 
    ReminderCron, 
    FoodOrderListener,
    PropertyListener,
    AgentListener,
    InventoryListener
  ],
})
export class NotificationsModule {}
