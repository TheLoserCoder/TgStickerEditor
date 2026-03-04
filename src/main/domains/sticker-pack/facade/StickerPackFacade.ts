import { IStickerPackFacade } from '../../../../shared/domains/sticker-pack/interfaces/IStickerPackFacade';
import { StickerPackManifest, Fragment, ManifestUpdateData } from '../../../../shared/domains/sticker-pack/types';
import { StickerPackType, StickerPackError } from '../../../../shared/domains/sticker-pack/enums';
import { GridLayout } from '../../../../shared/domains/grid/types';
import { IStickerPackService } from '../infrastructure/IStickerPackService';
import { IFragmentService } from '../fragment/IFragmentService';
import { IManifestService } from '../manifest/IManifestService';
import { IGridService } from '../../grid/services/IGridService';
import { IIdGenerator } from '../../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { IDataChangeNotifier } from '../../../../shared/domains/core/interfaces/IDataChangeNotifier';
import { NotificationGroup } from '../enums';
import { shell } from 'electron';

export class StickerPackFacade implements IStickerPackFacade {
  constructor(
    private packService: IStickerPackService,
    private manifestService: IManifestService,
    private fragmentService: IFragmentService,
    private gridService: IGridService,
    private idGenerator: IIdGenerator,
    private notifier: IDataChangeNotifier
  ) {}

  async createPack(name: string, type: StickerPackType): Promise<StickerPackManifest> {
    return this.notifier.notifyGroup(NotificationGroup.CREATE, async () => {
      const packId = this.idGenerator.generate();
      const packPath = await this.packService.createPackInfrastructure(packId, name);
      return await this.manifestService.create(packPath, packId, name, type);
    });
  }

  async getPack(id: string): Promise<StickerPackManifest | null> {
    const packPath = await this.packService.getPackPath(id);
    if (!packPath) {
      return null;
    }
    return await this.manifestService.read(packPath);
  }

  async getAllPacks(): Promise<StickerPackManifest[]> {
    const packIds = await this.packService.getAllPackIds();
    
    const manifests = await Promise.all(
      packIds.map(async id => {
        const packPath = await this.packService.getPackPath(id);
        if (!packPath) return null;
        return await this.manifestService.read(packPath);
      })
    );
    
    return manifests.filter((m): m is StickerPackManifest => m !== null);
  }

  async deletePack(id: string): Promise<void> {
    return this.notifier.notifyGroup(NotificationGroup.DELETE, async () => {
      await this.packService.deletePackInfrastructure(id);
    });
  }

  async updatePackManifest(id: string, updates: ManifestUpdateData): Promise<StickerPackManifest> {
    const packPath = await this.packService.getPackPath(id);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }
    return await this.manifestService.update(packPath, updates);
  }

  async addFragment(packId: string, sourceFilePath: string, fileName: string, groupId?: string): Promise<Fragment> {
    return this.notifier.notifyGroup(NotificationGroup.ADD_FRAGMENT, async () => {
      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }
      return await this.fragmentService.addFragment(packPath, sourceFilePath, fileName, groupId);
    });
  }

  async addFragments(packId: string, fragments: Array<{tempPath: string; fileName: string; groupId: string}>, gridData: Array<{id: string; groupId: string; row: number; col: number}>): Promise<GridLayout> {
    return this.notifier.notifyGroup(NotificationGroup.ADD_FRAGMENTS, async () => {
      const manifest = await this.getPack(packId);
      if (!manifest) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const savedFragments = await this.fragmentService.addFragmentsBatch(
        packPath,
        fragments.map(f => ({ sourceFilePath: f.tempPath, fileName: f.fileName, groupId: f.groupId }))
      );

      const fragmentIdMap = new Map<string, string>();
      savedFragments.forEach((saved, i) => {
        const originalFragmentId = gridData[i].id;
        fragmentIdMap.set(originalFragmentId, saved.id);
      });

      const currentGrid = manifest.gridLayout
        ? this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout)
        : this.gridService.initializeGrid(packId, manifest.type, []);

      const gridEntity = this.gridService.addFragments(
        currentGrid,
        gridData.map(gd => {
          const realId = fragmentIdMap.get(gd.id) || gd.id;
          return { id: realId, groupId: gd.groupId, row: gd.row, col: gd.col };
        })
      );

      await this.manifestService.updateWithGrid(packPath, gridEntity);
      return gridEntity.toDTO();
    });
  }

  async removeFragment(packId: string, fragmentId: string): Promise<void> {
    return this.notifier.notifyGroup(NotificationGroup.REMOVE_FRAGMENT, async () => {
      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }
      await this.fragmentService.removeFragment(packPath, fragmentId);
    });
  }

  async updateFragmentGroup(packId: string, fragmentId: string, groupId: string | null): Promise<Fragment> {
    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }
    return await this.fragmentService.updateFragmentGroup(packPath, fragmentId, groupId);
  }

  async getFragmentPath(packId: string, fragmentId: string): Promise<string | null> {
    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      return null;
    }
    return await this.fragmentService.getFragmentPath(packPath, fragmentId);
  }

  async openPackFolder(id: string): Promise<void> {
    const packPath = await this.packService.getPackPath(id);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }
    await shell.openPath(packPath);
  }

  async getStickerPackPath(id: string): Promise<string> {
    const packPath = await this.packService.getPackPath(id);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }
    return packPath;
  }

  async initializeGrid(packId: string): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const gridEntity = this.gridService.initializeGrid(
      packId,
      manifest.type,
      manifest.fragments.map(f => ({ id: f.id, groupId: f.groupId || undefined }))
    );

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async getGrid(packId: string): Promise<GridLayout | null> {
    const manifest = await this.getPack(packId);
    return manifest?.gridLayout || null;
  }

  async addFragmentsToGrid(packId: string, fragmentIds: string[]): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = manifest.gridLayout
      ? this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout)
      : this.gridService.initializeGrid(packId, manifest.type, []);

    const fragments = manifest.fragments.filter(f => fragmentIds.includes(f.id));
    const gridEntity = this.gridService.addFragments(
      currentGrid,
      fragments.map(f => ({ id: f.id, groupId: f.groupId || undefined }))
    );

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async moveGroupInGrid(packId: string, groupId: string, row: number, col: number): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.moveGroup(currentGrid, groupId, row, col);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async moveSingleFragmentInGrid(packId: string, fragmentId: string, row: number, col: number): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.moveSingleFragment(currentGrid, fragmentId, row, col);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async moveFragmentInGrid(packId: string, fragmentId: string, row: number, col: number): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.moveFragment(currentGrid, fragmentId, row, col);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async clearCellInGrid(packId: string, fragmentId: string): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.clearCell(currentGrid, fragmentId);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async removeGroupFromGrid(packId: string, groupId: string): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.removeGroup(currentGrid, groupId);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async createGroupFromFragments(packId: string, cellIds: string[]): Promise<GridLayout> {
    return this.notifier.notifyGroup(NotificationGroup.UPDATE, async () => {
      const manifest = await this.getPack(packId);
      if (!manifest?.gridLayout) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const newGroupId = this.idGenerator.generate();
      const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
      const gridEntity = this.gridService.createGroupFromFragments(currentGrid, cellIds, newGroupId);

      const fragmentIds = cellIds.filter(id => manifest.fragments.some(f => f.id === id));
      if (fragmentIds.length > 0) {
        await this.fragmentService.updateFragmentGroupBatch(packPath, fragmentIds, newGroupId);
      }
      await this.manifestService.updateWithGrid(packPath, gridEntity);
      return gridEntity.toDTO();
    });
  }

  async removeFragmentsFromGroup(packId: string, cellIds: string[]): Promise<GridLayout> {
    return this.notifier.notifyGroup(NotificationGroup.UPDATE, async () => {
      const manifest = await this.getPack(packId);
      if (!manifest?.gridLayout) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
      const gridEntity = this.gridService.removeFragmentsFromGroup(currentGrid, cellIds);

      const fragmentIds = cellIds.filter(id => manifest.fragments.some(f => f.id === id));
      if (fragmentIds.length > 0) {
        await this.fragmentService.updateFragmentGroupBatch(packPath, fragmentIds, null);
      }
      await this.manifestService.updateWithGrid(packPath, gridEntity);
      return gridEntity.toDTO();
    });
  }

  async deleteFragments(packId: string, fragmentIds: string[]): Promise<GridLayout> {
    return this.notifier.notifyGroup(NotificationGroup.REMOVE_FRAGMENT, async () => {
      const manifest = await this.getPack(packId);
      if (!manifest?.gridLayout) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
      const gridEntity = this.gridService.deleteFragments(currentGrid, fragmentIds);

      await this.fragmentService.removeFragmentsBatch(packPath, fragmentIds);
      await this.manifestService.updateWithGrid(packPath, gridEntity);
      return gridEntity.toDTO();
    });
  }

  async deleteGroupWithFragments(packId: string, groupId: string): Promise<GridLayout> {
    return this.notifier.notifyGroup(NotificationGroup.REMOVE_FRAGMENT, async () => {
      const manifest = await this.getPack(packId);
      if (!manifest?.gridLayout) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const packPath = await this.packService.getPackPath(packId);
      if (!packPath) {
        throw new Error(StickerPackError.PACK_NOT_FOUND);
      }

      const fragmentIds = manifest.gridLayout.cells
        .filter(c => c.groupId === groupId && c.fragmentId && manifest.fragments.some(f => f.id === c.fragmentId))
        .map(c => c.fragmentId!);

      const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
      const gridEntity = this.gridService.removeGroup(currentGrid, groupId);

      if (fragmentIds.length > 0) {
        await this.fragmentService.removeFragmentsBatch(packPath, fragmentIds);
      }
      await this.manifestService.updateWithGrid(packPath, gridEntity);
      return gridEntity.toDTO();
    });
  }

  async deleteGroupKeepFragments(packId: string, groupId: string): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const groupCells = manifest.gridLayout.cells.filter(c => c.groupId === groupId);
    const cellIds = groupCells.map(c => c.id);
    const fragmentIds = groupCells
      .filter(c => c.fragmentId && manifest.fragments.some(f => f.id === c.fragmentId))
      .map(c => c.fragmentId!);

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.removeFragmentsFromGroup(currentGrid, cellIds);

    if (fragmentIds.length > 0) {
      await this.fragmentService.updateFragmentGroupBatch(packPath, fragmentIds, null);
    }
    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }

  async normalizeGrid(packId: string): Promise<GridLayout> {
    const manifest = await this.getPack(packId);
    if (!manifest?.gridLayout) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const packPath = await this.packService.getPackPath(packId);
    if (!packPath) {
      throw new Error(StickerPackError.PACK_NOT_FOUND);
    }

    const currentGrid = this.gridService.loadGrid(packId, manifest.type, manifest.gridLayout);
    const gridEntity = this.gridService.normalizeGrid(currentGrid);

    await this.manifestService.updateWithGrid(packPath, gridEntity);
    return gridEntity.toDTO();
  }
}
