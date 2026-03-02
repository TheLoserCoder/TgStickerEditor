import { GridLayout, GridCell, FragmentGroup } from '@/shared/domains/grid/types';

export interface GridViewProps {
  layout: GridLayout;
  fragmentPaths: Map<string, string>;
  onMoveGroup: (groupId: string, targetRow: number, targetCol: number) => Promise<void>;
  onSwapFragments: (fragmentId1: string, fragmentId2: string) => Promise<void>;
}

export interface GridCellProps {
  cell: GridCell;
  fragmentPath: string | null;
  group: FragmentGroup | null;
  groupColor: string | null;
  isDragging: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  onFragmentClick?: (fragmentId: string, shiftKey: boolean, ctrlKey: boolean) => void;
}

export interface DraggableFragmentProps {
  fragmentId: string;
  fragmentPath: string | null;
  groupId: string;
  isDragging: boolean;
  isSelectionMode: boolean;
}

export interface DragData {
  fragmentId: string;
  groupId: string;
}
