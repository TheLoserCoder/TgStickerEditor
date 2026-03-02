import { StickerPackManifest, Fragment, ManifestUpdateData } from '@/shared/domains/sticker-pack/types';
import { StickerPackType, ManifestValidationError } from '@/shared/domains/sticker-pack/enums';
import { GridLayout } from '@/shared/domains/grid/types';
import { TelegramPackInfo } from '@/shared/domains/telegram/types';
import { ManifestValidator } from './ManifestValidator';

export class ManifestEntity {
  private constructor(
    public readonly id: string,
    public name: string,
    public readonly type: StickerPackType,
    public readonly createdAt: string,
    public updatedAt: string,
    public fragments: Fragment[],
    public gridLayout: GridLayout | null,
    public telegramPack: TelegramPackInfo | null
  ) {}

  static create(id: string, name: string, type: StickerPackType): ManifestEntity {
    ManifestValidator.validateName(name);
    
    const now = new Date().toISOString();
    return new ManifestEntity(
      id,
      name.trim(),
      type,
      now,
      now,
      [],
      null,
      null
    );
  }

  static fromDTO(dto: StickerPackManifest): ManifestEntity {
    const entity = new ManifestEntity(
      dto.id,
      dto.name,
      dto.type,
      dto.createdAt,
      dto.updatedAt,
      dto.fragments,
      dto.gridLayout || null,
      dto.telegramPack || null
    );
    
    ManifestValidator.validateName(entity.name);
    ManifestValidator.validateFragmentsCount(entity.fragments.length);
    
    return entity;
  }

  toDTO(): StickerPackManifest {
    const manifest: StickerPackManifest = {
      id: this.id,
      name: this.name,
      type: this.type,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      fragments: [...this.fragments]
    };

    if (this.gridLayout) {
      manifest.gridLayout = this.gridLayout;
    }

    if (this.telegramPack) {
      manifest.telegramPack = this.telegramPack;
    }

    return manifest;
  }

  update(updates: ManifestUpdateData): void {
    ManifestValidator.validateUpdate(this.fragments, updates);
    
    if (updates.name !== undefined) {
      this.name = updates.name.trim();
    }
    
    if (updates.fragments !== undefined) {
      this.fragments = updates.fragments;
    }
    
    if (updates.gridLayout !== undefined) {
      this.gridLayout = updates.gridLayout;
    }
    
    if (updates.telegramPack !== undefined) {
      this.telegramPack = updates.telegramPack;
    }
    
    this.touch();
  }

  addFragment(fragment: Fragment): void {
    ManifestValidator.validateFragmentsCount(this.fragments.length + 1);
    this.fragments.push(fragment);
    this.touch();
  }

  removeFragment(fragmentId: string): void {
    this.fragments = this.fragments.filter(f => f.id !== fragmentId);
    
    if (this.gridLayout) {
      this.gridLayout = {
        ...this.gridLayout,
        cells: this.gridLayout.cells.map(cell => 
          cell.fragmentId === fragmentId ? { ...cell, fragmentId: null } : cell
        )
      };
    }
    
    this.touch();
  }

  updateFragmentGroup(fragmentId: string, groupId: string | null): void {
    const fragmentIndex = this.fragments.findIndex(f => f.id === fragmentId);
    
    if (fragmentIndex === -1) {
      throw new Error(ManifestValidationError.FRAGMENT_NOT_FOUND);
    }

    this.fragments[fragmentIndex] = { ...this.fragments[fragmentIndex], groupId };
    this.touch();
  }

  private touch(): void {
    this.updatedAt = new Date().toISOString();
  }
}
