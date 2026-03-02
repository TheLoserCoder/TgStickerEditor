export interface IPackStorageRepository {
  createFolder(folderName: string): Promise<void>;
  deleteFolder(folderName: string): Promise<void>;
  getFolderPath(folderName: string): string;
}
