import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import Logger from '@/infra/logger/logger.service';
import { GCS_BUCKET } from '@/common/constants';

@Injectable()
export class StorageService {
  private readonly logger = Logger.getInstance('server');
  private readonly storage = new Storage();
  private readonly bucket = this.storage.bucket(GCS_BUCKET || '');

  public async generateSignedUploadUrl(
    fileName: string,
    mimeType: string,
  ): Promise<{ url: string; key: string }> {
    const key = `uploads/${Date.now()}_${fileName}`;

    const [url] = await this.bucket.file(key).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: mimeType,
    });

    this.logger.info(`Generated signed upload URL for ${key}`);
    return { url, key };
  }

  public getPublicUrl(key: string): string {
    return `https://storage.googleapis.com/${GCS_BUCKET}/${key}`;
  }
}
