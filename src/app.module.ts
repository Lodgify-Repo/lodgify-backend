import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { DatabaseModule } from './infra/database/database.module';
import { CacheModule } from './infra/cache/cache.module';
import { MailModule } from './infra/mail/mail.module';
import { QueueModule } from './infra/queue/queue.module';
import { WebSocketModule } from './infra/websocket/websocket.module';
import { StorageModule } from './infra/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HotelsModule } from './modules/hotels/hotels.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { SearchModule } from './modules/search/search.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { FoodModule } from './modules/food/food.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AgentsModule } from './modules/agents/agents.module';
import { OffersModule } from './modules/offers/offers.module';
import { ViewingsModule } from './modules/viewings/viewings.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';

import { envValidationSchema } from './common/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema: envValidationSchema }),
    DatabaseModule,
    CacheModule,
    MailModule,
    QueueModule,
    WebSocketModule,
    StorageModule,
    AuthModule,
    UsersModule,
    HotelsModule,
    RoomsModule,
    SearchModule,
    BookingsModule,
    PaymentsModule,
    NotificationsModule,
    DashboardModule,
    InventoryModule,
    FoodModule,
    PropertiesModule,
    AgentsModule,
    OffersModule,
    ViewingsModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Intercept all API entry routes to securely extract tenant metadata boundaries
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes({ path: 'api/*', method: RequestMethod.ALL });
  }
}
