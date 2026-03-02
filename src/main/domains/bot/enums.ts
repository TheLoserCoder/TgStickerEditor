export enum BotKey {
  ID = 'id',
  NAME = 'name',
  TOKEN = 'token',
  USER_ID = 'userId',
}

export enum BotValidationError {
  ID_EMPTY = 'ID не может быть пустым',
  NAME_EMPTY = 'Имя не может быть пустым',
  TOKEN_EMPTY = 'Token не может быть пустым',
  USER_ID_EMPTY = 'User ID не может быть пустым',
}

export enum BotStoreKey {
  BOTS = 'bots',
}

export enum BotServiceError {
  NOT_FOUND = 'Bot not found',
}

export enum BotDomain {
  BOTS = 'bots',
}
