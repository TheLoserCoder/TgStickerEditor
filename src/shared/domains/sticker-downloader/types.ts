export interface DownloadResultDTO {
  success: boolean;
  filePaths?: string[];
  error?: string;
}

export interface DownloadProgressInfo {
  progress: number;
  message: string;
}
