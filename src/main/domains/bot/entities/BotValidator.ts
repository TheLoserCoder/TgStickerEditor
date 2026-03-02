import { BotValidationError } from '../enums';

export class BotValidator {
  static validateId(id: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error(BotValidationError.ID_EMPTY);
    }
  }

  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error(BotValidationError.NAME_EMPTY);
    }
  }

  static validateToken(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new Error(BotValidationError.TOKEN_EMPTY);
    }
  }

  static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error(BotValidationError.USER_ID_EMPTY);
    }
  }
}
