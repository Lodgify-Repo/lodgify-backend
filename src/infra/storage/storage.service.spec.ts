import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { v2 as cloudinary } from 'cloudinary';

describe('StorageService', () => {
  let service: StorageService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      switch (key) {
        case 'CLOUDINARY_CLOUD_NAME':
          return 'test-cloud';
        case 'CLOUDINARY_API_KEY':
          return 'test-api-key';
        case 'CLOUDINARY_API_SECRET':
          return 'test-api-secret';
        default:
          return defaultValue || '';
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate signed upload parameters for Cloudinary', async () => {
    const result = await service.generateSignedUploadUrl('profile-pic.png', 'image/png');

    expect(result).toHaveProperty('url');
    expect(result.url).toContain('https://api.cloudinary.com/v1_1/test-cloud/auto/upload');
    expect(result).toHaveProperty('key');
    expect(result.key).toContain('uploads/');
    expect(result).toHaveProperty('signature');
    expect(result).toHaveProperty('timestamp');
    expect(result.apiKey).toBe('test-api-key');
    expect(result.cloudName).toBe('test-cloud');
  });

  it('should return empty string for empty public key', () => {
    expect(service.getPublicUrl('')).toBe('');
  });

  it('should return already full URL as is', () => {
    const fullUrl = 'https://res.cloudinary.com/test-cloud/image/upload/sample.jpg';
    expect(service.getPublicUrl(fullUrl)).toBe(fullUrl);
  });

  it('should generate public url for a key', () => {
    const key = 'uploads/12345_sample';
    const publicUrl = service.getPublicUrl(key);
    expect(publicUrl).toContain(key);
  });
});
