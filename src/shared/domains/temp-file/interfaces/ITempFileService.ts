export interface ITempFileService {
  saveBlobToTemp(data: number[], fileName: string, sessionId?: string): Promise<string>;
  readTempFileAsBlob(filePath: string): Promise<number[]>;
}
