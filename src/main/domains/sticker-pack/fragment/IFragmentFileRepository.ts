export interface IFragmentFileRepository {
  copyFile(folderPath: string, sourceFilePath: string, fileName: string): Promise<void>;
  deleteFile(folderPath: string, fileName: string): Promise<void>;
  getFilePath(folderPath: string, fileName: string): Promise<string | null>;
}
