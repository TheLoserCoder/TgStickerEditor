import { ITempFileService } from './ITempFileService';
import { IFileSystemService } from '../../filesystem/IFileSystemService';
import { IIdGenerator } from '../../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { TempFileError } from '../enums';
import { TEMP_BASE_DIR } from '../constants';
import path from 'path';

export class TempFileService implements ITempFileService {
  constructor(
    private fileSystem: IFileSystemService,
    private idGenerator: IIdGenerator
  ) {}

  async createTempFile(sessionId: string, stage: string, extension: string): Promise<string> {
    try {
      const dir = await this.createTempDir(sessionId, stage);
      const fileName = `${this.idGenerator.generate()}.${extension}`;
      return path.join(dir, fileName);
    } catch (error) {
      throw new Error(TempFileError.CREATION_FAILED);
    }
  }

  async createTempDir(sessionId: string, stage: string): Promise<string> {
    try {
      const dir = path.join(process.cwd(), TEMP_BASE_DIR, sessionId, stage);
      await this.fileSystem.mkdir(dir, { recursive: true });
      return dir;
    } catch (error) {
      throw new Error(TempFileError.CREATION_FAILED);
    }
  }

  async writeTempFile(filePath: string, data: Buffer): Promise<void> {
    try {
      await this.fileSystem.writeFile(filePath, data);
    } catch (error) {
      throw new Error(TempFileError.WRITE_FAILED);
    }
  }

  async readTempFile(filePath: string): Promise<Buffer> {
    try {
      return await this.fileSystem.readFile(filePath);
    } catch (error) {
      throw new Error(TempFileError.READ_FAILED);
    }
  }

  async cleanupSession(sessionId: string): Promise<void> {
    try {
      const sessionDir = path.join(process.cwd(), TEMP_BASE_DIR, sessionId);
      const exists = await this.fileSystem.exists(sessionDir);
      if (exists) {
        await this.fileSystem.rm(sessionDir, { recursive: true, force: true });
      }
    } catch (error) {
      throw new Error(TempFileError.CLEANUP_FAILED);
    }
  }

  async cleanupStage(sessionId: string, stage: string): Promise<void> {
    try {
      const stageDir = path.join(process.cwd(), TEMP_BASE_DIR, sessionId, stage);
      const exists = await this.fileSystem.exists(stageDir);
      if (exists) {
        await this.fileSystem.rm(stageDir, { recursive: true, force: true });
      }
    } catch (error) {
      throw new Error(TempFileError.CLEANUP_FAILED);
    }
  }

  async saveBlobToTemp(data: Buffer, fileName: string, sessionId?: string): Promise<string> {
    try {
      const dir = sessionId 
        ? path.join(process.cwd(), TEMP_BASE_DIR, sessionId)
        : path.join(process.cwd(), TEMP_BASE_DIR);
      
      await this.fileSystem.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, fileName);
      
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      await this.fileSystem.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      throw new Error(TempFileError.WRITE_FAILED);
    }
  }

  async readTempFileAsBlob(filePath: string): Promise<number[]> {
    try {
      const buffer = await this.fileSystem.readFile(filePath);
      return Array.from(buffer);
    } catch (error) {
      throw new Error(TempFileError.READ_FAILED);
    }
  }
}
