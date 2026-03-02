export enum ImageFormat {
  PNG = 'png',
  WEBP = 'webp',
  GIF = 'gif',
  APNG = 'apng',
  WEBM = 'webm'
}

export enum RescaleQuality {
  NONE = 'none',
  LANCZOS3 = 'lanczos3',
  NEAREST = 'nearest',
}

export enum ImageProcessingIPCChannel {
  PROGRESS = 'image-processing:progress'
}

export enum ImageProcessingStage {
  PROCESSING = 'processing',
}
