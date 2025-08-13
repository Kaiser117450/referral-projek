import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { localFileService } from './local-file.service';

export class S3Service {
  private client?: S3Client;
  private bucketName?: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    this.bucketName = process.env.AWS_S3_BUCKET?.trim();

    if (this.bucketName) {
      this.client = new S3Client({ region: this.region });
    } else {
      console.warn('AWS_S3_BUCKET not configured, using local storage');
    }
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.bucketName || !this.client) {
      return localFileService.saveBuffer(key, buffer);
    }

    try {
      await this.client.send(new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read'
      }));

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      console.warn('S3 upload failed, using local storage:', error);
      return localFileService.saveBuffer(key, buffer);
    }
  }
}

export const s3Service = new S3Service();



