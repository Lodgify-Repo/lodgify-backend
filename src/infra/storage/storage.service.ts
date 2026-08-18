import { Injectable } from '@nestjs/common';
import Logger from '@/infra/logger/logger.service';

@Injectable()
export class StorageService {
  private readonly logger = Logger.getInstance('server');

  public async generateSignedUploadUrl(fileName: string, mimeType: string): Promise<{ url: string; key: string }> {
    this.logger.info(`Generated signed URL for ${fileName}`);
    // Mock implementation for generating signed URLs (e.g. AWS S3, Google Cloud Storage)
    const key = `uploads/${Date.now()}_${fileName}`;
    return {
      url: `https://storage.example.com/upload?key=${key}`,
      key,
    };
  }

  public getPublicUrl(key: string): string {
    return `https://storage.example.com/${key}`;
  }
}
