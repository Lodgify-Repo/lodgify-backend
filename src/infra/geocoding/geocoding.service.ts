import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Logger from '@/infra/logger/logger.service';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

@Injectable()
export class GeocodingService {
  private readonly logger = Logger.getInstance('server');
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAPS_KEY', '');
  }

  /**
   * Geocode a full address string into lat/lng coordinates using Google Maps Geocoding API.
   * Returns null if the API key is not configured or the geocoding request fails.
   */
  async geocode(address: string, city: string, state: string, country: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      this.logger.warn('[GeocodingService]: GOOGLE_MAPS_KEY not configured — skipping geocoding');
      return null;
    }

    const fullAddress = [address, city, state, country].filter(Boolean).join(', ');

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', fullAddress);
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(`[GeocodingService]: Geocoding failed for "${fullAddress}" — status: ${data.status}`);
        return null;
      }

      const { lat, lng } = data.results[0].geometry.location;
      const formattedAddress = data.results[0].formatted_address;

      this.logger.info(`[GeocodingService]: Geocoded "${fullAddress}" → (${lat}, ${lng})`);

      return { latitude: lat, longitude: lng, formattedAddress };
    } catch (error) {
      this.logger.error(`[GeocodingService]: Geocoding request failed: ${(error as Error).message}`);
      return null;
    }
  }
}
