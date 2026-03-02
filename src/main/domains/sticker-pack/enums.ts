export enum StickerPackValidationError {
  ID_EMPTY = 'Pack ID cannot be empty',
  TITLE_EMPTY = 'Pack title cannot be empty',
}

export enum FragmentValidationError {
  FILENAME_EMPTY = 'Fragment fileName cannot be empty',
}

export enum FragmentServiceError {
  NOT_FOUND = 'Fragment not found',
}

export enum NotificationGroup {
  CREATE = 'stickerPack:create',
  DELETE = 'stickerPack:delete',
  ADD_FRAGMENT = 'stickerPack:addFragment',
  ADD_FRAGMENTS = 'stickerPack:addFragments',
  REMOVE_FRAGMENT = 'stickerPack:removeFragment',
}
