export enum TelegramUploadStatus {
  NOT_UPLOADED = 'NOT_UPLOADED',
  UPLOADING = 'UPLOADING',
  UPLOADED = 'UPLOADED',
  ERROR = 'ERROR',
  EMPTY_PLACEHOLDER = 'EMPTY_PLACEHOLDER',
}

export enum TelegramStickerFormat {
  STATIC = 'static',
  ANIMATED = 'animated',
  VIDEO = 'video',
}

export enum TelegramStickerType {
  REGULAR = 'regular',
  CUSTOM_EMOJI = 'custom_emoji',
}

export enum TelegramError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  PEER_ID_INVALID = 'PEER_ID_INVALID',
  STICKER_DIMENSIONS = 'STICKER_DIMENSIONS',
  PACK_NAME_OCCUPIED = 'PACK_NAME_OCCUPIED',
  PACK_NOT_FOUND = 'PACK_NOT_FOUND',
  UNKNOWN = 'UNKNOWN',
}

export enum TelegramServiceToken {
  ADAPTER = 'TelegramAdapter',
  UPLOADER = 'TelegramUploaderService',
  EMPTY_IMAGE_GENERATOR = 'EmptyImageGenerator',
}

export enum TelegramIPCChannel {
  UPLOAD_PROGRESS = 'telegram:upload:progress',
  DELETE_PROGRESS = 'telegram:delete:progress',
}
