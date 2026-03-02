import { promises as fs } from 'fs';
import { IFileSystemService } from './IFileSystemService';
import { FileEncoding } from '../enums';

export class FileSystemService implements IFileSystemService {
  async writeFile(path: string, data: string | Buffer): Promise<void> {
    if (Buffer.isBuffer(data)) {
      await fs.writeFile(path, data);
    } else {
      await fs.writeFile(path, data, FileEncoding.UTF8);
    }
  }

  async readFile(path: string): Promise<Buffer> {
    return await fs.readFile(path);
  }

  async mkdir(path: string, options?: { recursive: boolean }): Promise<void> {
    await fs.mkdir(path, options);
  }

  async readdir(path: string): Promise<string[]> {
    return await fs.readdir(path);
  }

  async rm(path: string, options?: { recursive: boolean; force?: boolean }): Promise<void> {
    await fs.rm(path, options);
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }
}
