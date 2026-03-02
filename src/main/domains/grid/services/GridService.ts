import { IGridService, FragmentInput } from './IGridService';
import { GridEntity } from '../entities/GridEntity';
import { GridLayout } from '../../../../shared/domains/grid/types';
import { ISmartGridCalculator } from '../utils/ISmartGridCalculator';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { GRID_COLUMNS } from '../constants';
import { IIdGenerator } from '../../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { isEmptyCell } from '../../../../shared/domains/grid/utils';

export class GridService implements IGridService {
  constructor(
    private calculator: ISmartGridCalculator,
    private idGenerator: IIdGenerator
  ) {}

  initializeGrid(packId: string, packType: StickerPackType, fragments: FragmentInput[]): GridEntity {
    if (fragments.length === 0) {
      return GridEntity.create(packId, packType, 
        packType === StickerPackType.EMOJI ? GRID_COLUMNS.EMOJI : GRID_COLUMNS.STICKER, 
        0, [], []);
    }
    const layout = this.calculator.calculateInitialLayout(fragments, packType);
    return GridEntity.create(packId, packType, layout.columns, layout.rows, layout.cells, layout.groups);
  }

  loadGrid(packId: string, packType: StickerPackType, layout: GridLayout, validFragmentIds?: string[]): GridEntity {
    if (validFragmentIds) {
      const validSet = new Set(validFragmentIds);
      const cleanedCells = layout.cells.map(cell => {
        if (cell.fragmentId && !validSet.has(cell.fragmentId)) {
          return { ...cell, fragmentId: null };
        }
        return cell;
      });
      layout = { ...layout, cells: cleanedCells };
    }
    return GridEntity.fromStorage(packId, packType, layout);
  }

  addFragments(currentGrid: GridEntity, newFragments: FragmentInput[]): GridEntity {
    const layout = this.calculator.addFragments(currentGrid.toDTO(), newFragments);
    return currentGrid.withLayout(layout);
  }

  moveGroup(currentGrid: GridEntity, groupId: string, targetRow: number, targetCol: number): GridEntity {
    const layout = this.calculator.moveGroup(currentGrid.toDTO(), groupId, targetRow, targetCol);
    return currentGrid.withLayout(layout);
  }

  moveSingleFragment(currentGrid: GridEntity, fragmentId: string, targetRow: number, targetCol: number): GridEntity {
    const layout = this.calculator.moveSingleFragment(currentGrid.toDTO(), fragmentId, targetRow, targetCol);
    return currentGrid.withLayout(layout);
  }

  moveFragment(currentGrid: GridEntity, fragmentId: string, targetRow: number, targetCol: number): GridEntity {
    const layout = this.calculator.moveFragment(currentGrid.toDTO(), fragmentId, targetRow, targetCol);
    return currentGrid.withLayout(layout);
  }

  clearCell(currentGrid: GridEntity, fragmentId: string): GridEntity {
    const layout = this.calculator.clearCell(currentGrid.toDTO(), fragmentId);
    return currentGrid.withLayout(layout);
  }

  removeGroup(currentGrid: GridEntity, groupId: string): GridEntity {
    const layout = this.calculator.removeGroup(currentGrid.toDTO(), groupId);
    return currentGrid.withLayout(layout);
  }

  createGroupFromFragments(currentGrid: GridEntity, cellIds: string[], newGroupId: string): GridEntity {
    const layout = this.calculator.createGroupFromFragments(currentGrid.toDTO(), cellIds, newGroupId);
    return currentGrid.withLayout(layout);
  }

  removeFragmentsFromGroup(currentGrid: GridEntity, cellIds: string[]): GridEntity {
    const layout = this.calculator.removeFragmentsFromGroup(currentGrid.toDTO(), cellIds);
    return currentGrid.withLayout(layout);
  }

  deleteFragments(currentGrid: GridEntity, fragmentIds: string[]): GridEntity {
    const layout = this.calculator.deleteFragments(currentGrid.toDTO(), fragmentIds);
    return currentGrid.withLayout(layout);
  }

  normalizeGrid(currentGrid: GridEntity): GridEntity {
    const currentLayout = currentGrid.toDTO();
    const fragments: FragmentInput[] = currentLayout.cells
      .filter(c => !isEmptyCell(c))
      .map(c => ({ id: c.fragmentId!, groupId: c.groupId, row: c.row, col: c.col }));
    
    const layout = this.calculator.calculateInitialLayout(fragments, currentGrid.packType);
    return currentGrid.withLayout(layout);
  }
}
