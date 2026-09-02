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
    this.apiKey = this.configService.get<string>('LOCATIONIQ_API_KEY', '');
  }

  /**
   * Geocode a full address string into lat/lng coordinates using LocationIQ Geocoding API.
   * Returns null if the API key is not configured or the geocoding request fails.
   */
  async geocode(address: string, city: string, state: string, country: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      this.logger.warn('[GeocodingService]: LOCATIONIQ_API_KEY not configured — skipping geocoding');
      return null;
    }

    const fullAddress = [address, city, state, country].filter(Boolean).join(', ');

    try {
      const url = new URL('https://us1.locationiq.com/v1/search');
      url.searchParams.set('q', fullAddress);
      url.searchParams.set('key', this.apiKey);
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '1');

      const response = await fetch(url.toString());
      if (!response.ok) {
        this.logger.warn(`[GeocodingService]: Geocoding failed for "${fullAddress}" — status: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (!Array.isArray(data) || !data.length) {
        this.logger.warn(`[GeocodingService]: Geocoding returned no results for "${fullAddress}"`);
        return null;
      }

      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      const formattedAddress = data[0].display_name || fullAddress;

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        this.logger.warn(`[GeocodingService]: Invalid coordinates returned for "${fullAddress}"`);
        return null;
      }

      this.logger.info(`[GeocodingService]: Geocoded "${fullAddress}" → (${lat}, ${lng})`);

      return { latitude: lat, longitude: lng, formattedAddress };
    } catch (error) {
      this.logger.error(`[GeocodingService]: Geocoding request failed: ${(error as Error).message}`);
      return null;
    }
  }
}
