import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class S3Service {
  private client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-southeast-1';
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    this.client = new S3Client({ region: this.region });
  }

  async uploadBuffer(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    }));

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}

export const s3Service = new S3Service();



