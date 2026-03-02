export enum StickerPackType {
  EMOJI = 'EMOJI',
  STICKER = 'STICKER',
}

export enum ManifestValidationError {
  NAME_EMPTY = 'Название стикерпака не может быть пустым',
  MAX_FRAGMENTS_EXCEEDED = 'Стикерпак не может содержать больше 200 фрагментов',
  FRAGMENT_NOT_FOUND = 'Фрагмент не найден',
  INVALID_GRID_FRAGMENT = 'Сетка содержит несуществующие фрагменты',
  MANIFEST_NOT_FOUND = 'Манифест не найден',
}

export enum StickerPackError {
  PACK_NOT_FOUND = 'Стикерпак не найден',
}

export enum StickerPackKey {
  ID = 'id',
  NAME = 'name',
  TYPE = 'type',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  FRAGMENTS = 'fragments',
  GRID = 'grid',
}

export enum StickerPackStoreKey {
  INDEX = 'stickerPacks',
}

export enum StickerPackFileName {
  MANIFEST = 'manifest.json',
}

export enum StickerPackFolderName {
  BASE = 'sticker-packs',
}

export enum StickerPackServiceToken {
  SERVICE = 'StickerPackService',
  MANIFEST = 'ManifestService',
  FRAGMENT = 'FragmentService',
  FACADE = 'StickerPackFacade',
}

export enum StickerPackDomain {
  STICKER_PACKS = 'stickerPacks',
}

export enum ManifestDomain {
  MANIFESTS = 'manifests',
}
