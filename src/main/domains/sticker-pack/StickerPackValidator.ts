import { StickerPackValidationError } from '@/shared/domains/sticker-pack/enums';
import { MAX_FRAGMENTS_PER_PACK } from './constants';
import { Fragment, GridCell } from '@/shared/domains/sticker-pack/types';

export class StickerPackValidator {
  static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error(StickerPackValidationError.NAME_EMPTY);
    }
  }

  static validateFragmentsCount(count: number): void {
    if (count > MAX_FRAGMENTS_PER_PACK) {
      throw new Error(StickerPackValidationError.MAX_FRAGMENTS_EXCEEDED);
    }
  }

  static validateGridConsistency(fragments: Fragment[], grid: GridCell[]): void {
    const fragmentIds = new Set(fragments.map(f => f.id));
    const invalidCells = grid.filter(c => c.fragmentId && !fragmentIds.has(c.fragmentId));
    
    if (invalidCells.length > 0) {
      throw new Error(StickerPackValidationError.INVALID_GRID_FRAGMENT);
    }
  }
}
