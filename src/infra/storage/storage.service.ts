import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import Logger from '@/infra/logger/logger.service';

export interface SignedUploadResponse {
  url: string;
  key: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
}

@Injectable()
export class StorageService {
  private readonly logger = Logger.getInstance('server');
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME', '');
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET', '');

    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL', '');

    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl });
    } else if (this.cloudName && this.apiKey && this.apiSecret) {
      cloudinary.config({
        cloud_name: this.cloudName,
        api_key: this.apiKey,
        api_secret: this.apiSecret,
        secure: true,
      });
    }
  }

  public async generateSignedUploadUrl(
    fileName: string,
    mimeType?: string,
  ): Promise<SignedUploadResponse> {
    const timestamp = Math.floor(Date.now() / 1000);
    const sanitizedFileName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `uploads/${Date.now()}_${sanitizedFileName}`;

    const paramsToSign = {
      public_id: publicId,
      timestamp,
    };

    const signature = this.apiSecret
      ? cloudinary.utils.api_sign_request(paramsToSign, this.apiSecret)
      : '';

    const url = `https://api.cloudinary.com/v1_1/${this.cloudName || 'Ted Lasso'}/auto/upload`;

    this.logger.info(`Generated signed upload parameters for ${publicId}`);

    return {
      url,
      key: publicId,
      signature,
      timestamp,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
    };
  }

  public getPublicUrl(key: string): string {
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    return cloudinary.url(key, { secure: true });
  }
}
