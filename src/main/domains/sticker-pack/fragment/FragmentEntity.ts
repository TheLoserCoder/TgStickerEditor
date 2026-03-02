import { Fragment } from '@/shared/domains/sticker-pack/types';
import { FragmentValidationError } from '../enums';

export class FragmentEntity {
  private constructor(
    public readonly id: string,
    public readonly fileName: string,
    public groupId: string | null
  ) {}

  static create(id: string, fileName: string, groupId: string | null = null): FragmentEntity {
    if (!fileName || fileName.trim().length === 0) {
      throw new Error(FragmentValidationError.FILENAME_EMPTY);
    }

    return new FragmentEntity(id, fileName.trim(), groupId);
  }

  static fromDTO(dto: Fragment): FragmentEntity {
    return new FragmentEntity(dto.id, dto.fileName, dto.groupId);
  }

  toDTO(): Fragment {
    return {
      id: this.id,
      fileName: this.fileName,
      groupId: this.groupId
    };
  }

  updateGroup(groupId: string | null): FragmentEntity {
    return new FragmentEntity(this.id, this.fileName, groupId);
  }
}
