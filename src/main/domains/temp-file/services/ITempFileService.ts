export interface ITempFileService {
  createTempFile(sessionId: string, stage: string, extension: string): Promise<string>;
  createTempDir(sessionId: string, stage: string): Promise<string>;
  writeTempFile(path: string, data: Buffer): Promise<void>;
  readTempFile(path: string): Promise<Buffer>;
  cleanupSession(sessionId: string): Promise<void>;
  cleanupStage(sessionId: string, stage: string): Promise<void>;
  saveBlobToTemp(data: Buffer, fileName: string, sessionId?: string): Promise<string>;
}
