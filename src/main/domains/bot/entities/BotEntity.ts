import { BotValidator } from './BotValidator';

export class BotEntity {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly token: string,
    public readonly userId: string
  ) {}

  static create(id: string, name: string, token: string, userId: string): BotEntity {
    BotValidator.validateId(id);
    BotValidator.validateName(name);
    BotValidator.validateToken(token);
    BotValidator.validateUserId(userId);

    return new BotEntity(id.trim(), name.trim(), token.trim(), userId.trim());
  }

  static fromStorage(id: string, name: string, token: string, userId: string): BotEntity {
    return new BotEntity(id, name, token, userId);
  }
}
