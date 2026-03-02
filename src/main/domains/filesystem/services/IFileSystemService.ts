export interface IFileSystemService {
  writeFile(path: string, data: string | Buffer): Promise<void>;
  readFile(path: string): Promise<Buffer>;
  mkdir(path: string, options?: { recursive: boolean }): Promise<void>;
  readdir(path: string): Promise<string[]>;
  rm(path: string, options?: { recursive: boolean; force?: boolean }): Promise<void>;
  exists(path: string): Promise<boolean>;
  copyFile(source: string, destination: string): Promise<void>;
}
