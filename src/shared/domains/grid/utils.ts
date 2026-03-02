import { GridLayout, GridCell } from './types';

export interface FlatGridCell {
  cellId: string;
  fragmentId: string | null;
  row: number;
  col: number;
}

export function gridToFlatArray(grid: GridLayout): FlatGridCell[] {
  return grid.cells
    .slice()
    .sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    })
    .map(cell => ({
      cellId: cell.id,
      fragmentId: cell.fragmentId,
      row: cell.row,
      col: cell.col,
    }));
}

export function isEmptyCell(cell: GridCell | FlatGridCell): boolean {
  return !cell.fragmentId;
}
