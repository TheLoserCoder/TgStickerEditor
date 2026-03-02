import { IFragmentFileRepository } from './IFragmentFileRepository';
import { IFileSystemService } from '../../filesystem/services/IFileSystemService';
import * as path from 'path';

export class FragmentFileRepository implements IFragmentFileRepository {
  constructor(private fileSystem: IFileSystemService) {}

  async copyFile(folderPath: string, sourceFilePath: string, fileName: string): Promise<void> {
    const fragmentsDir = path.join(folderPath, 'fragments');
    await this.fileSystem.mkdir(fragmentsDir, { recursive: true });
    const destPath = path.join(fragmentsDir, fileName);
    await this.fileSystem.copyFile(sourceFilePath, destPath);
  }

  async deleteFile(folderPath: string, fileName: string): Promise<void> {
    const fragmentsDir = path.join(folderPath, 'fragments');
    const filePath = path.join(fragmentsDir, fileName);
    const exists = await this.fileSystem.exists(filePath);
    
    if (exists) {
      await this.fileSystem.rm(filePath);
    }
  }

  async getFilePath(folderPath: string, fileName: string): Promise<string | null> {
    const fragmentsDir = path.join(folderPath, 'fragments');
    const filePath = path.join(fragmentsDir, fileName);
    const exists = await this.fileSystem.exists(filePath);
    
    return exists ? filePath : null;
  }
}
