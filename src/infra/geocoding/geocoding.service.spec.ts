import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GeocodingService } from './geocoding.service';

describe('GeocodingService', () => {
  let service: GeocodingService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-locationiq-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<GeocodingService>(GeocodingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return null if LOCATIONIQ_API_KEY is not configured', async () => {
    mockConfigService.get.mockReturnValue('');
    const noKeyService = new GeocodingService(mockConfigService as any);

    const result = await noKeyService.geocode('123 Main St', 'Lagos', 'Lagos', 'Nigeria');
    expect(result).toBeNull();
  });

  it('should successfully geocode an address using LocationIQ API', async () => {
    const mockResponse = [
      {
        place_id: '12345',
        lat: '6.4281',
        lon: '3.4219',
        display_name: '123 Main St, Lagos, Nigeria',
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(mockResponse),
    } as any);

    const result = await service.geocode('123 Main St', 'Lagos', 'Lagos', 'Nigeria');

    expect(result).toEqual({
      latitude: 6.4281,
      longitude: 3.4219,
      formattedAddress: '123 Main St, Lagos, Nigeria',
    });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('https://us1.locationiq.com/v1/search'),
    );
  });

  it('should return null if LocationIQ returns empty array or error status', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as any);

    const result = await service.geocode('Unknown place', '', '', '');
    expect(result).toBeNull();
  });

  it('should return null on network exception', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network offline'));

    const result = await service.geocode('123 Main St', 'Lagos', 'Lagos', 'Nigeria');
    expect(result).toBeNull();
  });
});
