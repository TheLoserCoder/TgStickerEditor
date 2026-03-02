import { GridLayout, GridCell, FragmentGroup } from '../../../../shared/domains/grid/types';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { GRID_COLUMNS } from '../constants';
import { GridValidationError } from '../enums';

export class GridEntity {
  private constructor(
    public readonly packId: string,
    public readonly packType: StickerPackType,
    public readonly columns: number,
    public readonly rows: number,
    public readonly cells: GridCell[],
    public readonly groups: FragmentGroup[]
  ) {}

  static create(
    packId: string,
    packType: StickerPackType,
    columns: number,
    rows: number,
    cells: GridCell[],
    groups: FragmentGroup[]
  ): GridEntity {
    this.validate(packType, columns, cells);
    return new GridEntity(packId, packType, columns, rows, cells, groups);
  }

  static fromStorage(
    packId: string,
    packType: StickerPackType,
    layout: GridLayout
  ): GridEntity {
    return new GridEntity(
      packId,
      packType,
      layout.columns,
      layout.rows,
      layout.cells,
      layout.groups
    );
  }

  toDTO(): GridLayout {
    return {
      columns: this.columns,
      rows: this.rows,
      cells: this.cells,
      groups: this.groups
    };
  }

  withLayout(layout: GridLayout): GridEntity {
    return GridEntity.create(this.packId, this.packType, layout.columns, layout.rows, layout.cells, layout.groups);
  }

  private static validate(packType: StickerPackType, columns: number, cells: GridCell[]): void {
    const expectedColumns = packType === StickerPackType.EMOJI ? GRID_COLUMNS.EMOJI : GRID_COLUMNS.STICKER;
    
    if (columns !== expectedColumns) {
      throw new Error(GridValidationError.INVALID_COLUMNS);
    }

    for (const cell of cells) {
      if (cell.col >= columns) {
        throw new Error(GridValidationError.POSITION_OUT_OF_BOUNDS);
      }
    }
  }
}
