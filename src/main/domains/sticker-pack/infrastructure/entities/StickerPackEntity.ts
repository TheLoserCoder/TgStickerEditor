import { StickerPackInfrastructureDTO } from '../../../../../shared/domains/sticker-pack/types';
import { StickerPackValidationError } from '../../enums';

export class StickerPackEntity {
  private constructor(
    public readonly id: string,
    public readonly title: string
  ) {}

  static create(id: string, title: string): StickerPackEntity {
    if (!id || id.trim().length === 0) {
      throw new Error(StickerPackValidationError.ID_EMPTY);
    }
    
    if (!title || title.trim().length === 0) {
      throw new Error(StickerPackValidationError.TITLE_EMPTY);
    }
    
    const sanitizedTitle = this.sanitizeTitle(title);
    
    return new StickerPackEntity(id, sanitizedTitle);
  }

  static fromStorage(id: string, title: string): StickerPackEntity {
    return new StickerPackEntity(id, title);
  }

  get folderName(): string {
    return `${this.title}_${this.id}`;
  }

  toDTO(): StickerPackInfrastructureDTO {
    return {
      id: this.id,
      title: this.title,
      folderName: this.folderName
    };
  }

  private static sanitizeTitle(title: string): string {
    return title
      .trim()
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 50);
  }
}
