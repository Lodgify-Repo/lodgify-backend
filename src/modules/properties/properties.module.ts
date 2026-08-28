import { Module } from '@nestjs/common';

// Services
import { PropertiesService } from './services/properties.service';
import { PropertyPricingService } from './services/property-pricing.service';
import { PropertyCalendarService } from './services/property-calendar.service';
import { PropertyMarketplaceService } from './services/property-marketplace.service';
import { PropertyBookingsService } from './services/property-bookings.service';
import { PropertyMessagesService } from './services/property-messages.service';
import { PropertyReviewsService } from './services/property-reviews.service';

// Controllers
import { PropertiesController } from './http/properties.controller';
import { PropertyPricingController } from './http/property-pricing.controller';
import { PropertyCalendarController } from './http/property-calendar.controller';
import { PropertyMarketplaceController } from './http/property-marketplace.controller';
import { PropertyBookingsController } from './http/property-bookings.controller';
import { PropertyMessagesController } from './http/property-messages.controller';
import { PropertyReviewsController } from './http/property-reviews.controller';

@Module({
  controllers: [
    PropertiesController,
    PropertyPricingController,
    PropertyCalendarController,
    PropertyMarketplaceController,
    PropertyBookingsController,
    PropertyMessagesController,
    PropertyReviewsController,
  ],
  providers: [
    PropertiesService,
    PropertyPricingService,
    PropertyCalendarService,
    PropertyMarketplaceService,
    PropertyBookingsService,
    PropertyMessagesService,
    PropertyReviewsService,
  ],
  exports: [
    PropertiesService,
    PropertyPricingService,
    PropertyCalendarService,
    PropertyMarketplaceService,
    PropertyBookingsService,
    PropertyMessagesService,
    PropertyReviewsService,
  ],
})
export class PropertiesModule {}
