import { ManifestValidationError } from '@/shared/domains/sticker-pack/enums';
import { MAX_FRAGMENTS_PER_PACK } from '../constants';
import { Fragment, ManifestUpdateData } from '@/shared/domains/sticker-pack/types';

export class ManifestValidator {
  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error(ManifestValidationError.NAME_EMPTY);
    }
  }

  static validateFragmentsCount(count: number): void {
    if (count > MAX_FRAGMENTS_PER_PACK) {
      throw new Error(ManifestValidationError.MAX_FRAGMENTS_EXCEEDED);
    }
  }

  static validateUpdate(currentFragments: Fragment[], updates: ManifestUpdateData): void {
    if (updates.name !== undefined) {
      this.validateName(updates.name);
    }
    
    if (updates.fragments !== undefined) {
      this.validateFragmentsCount(updates.fragments.length);
    }
  }
}
