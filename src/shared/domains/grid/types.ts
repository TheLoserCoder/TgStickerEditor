export interface GridCell {
  id: string;
  fragmentId: string | null;
  groupId: string;
  row: number;
  col: number;
}

export interface FragmentGroup {
  id: string;
  fragmentIds: string[];
}

export interface GridLayout {
  columns: number;
  rows: number;
  cells: GridCell[];
  groups: FragmentGroup[];
}
