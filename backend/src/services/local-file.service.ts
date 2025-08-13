import { promises as fs } from 'fs';
import path from 'path';

export class LocalFileService {
  private basePath: string;

  constructor() {
    this.basePath = path.resolve(process.cwd(), 'uploads');
  }

  async saveBuffer(key: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(this.basePath, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return `/uploads/${key}`;
  }
}

export const localFileService = new LocalFileService();
