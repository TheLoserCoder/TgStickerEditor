import { IPackStorageRepository } from './IPackStorageRepository';
import { IFileSystemService } from '../../../filesystem/services/IFileSystemService';
import * as path from 'path';

export class PackStorageRepository implements IPackStorageRepository {
  constructor(
    private readonly fileSystem: IFileSystemService,
    private readonly basePath: string
  ) {}

  async createFolder(folderName: string): Promise<void> {
    await this.fileSystem.mkdir(this.getFolderPath(folderName), { recursive: true });
  }

  async deleteFolder(folderName: string): Promise<void> {
    try {
      await this.fileSystem.rm(this.getFolderPath(folderName), { recursive: true });
    } catch {
      // Папка не существует - игнорируем
    }
  }

  getFolderPath(folderName: string): string {
    return path.join(this.basePath, folderName);
  }
}
