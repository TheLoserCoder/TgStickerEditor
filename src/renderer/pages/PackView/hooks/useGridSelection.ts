import { useState, useCallback, useEffect } from 'react';
import { GridLayout } from '@/shared/domains/grid/types';

export interface SelectionState {
  selectedCellIds: Set<string>;
  anchorCellId: string | null;
  isSelectionMode: boolean;
}

export const useGridSelection = (layout: GridLayout | null) => {
  const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
  const [anchorCellId, setAnchorCellId] = useState<string | null>(null);

  const isSelectionMode = selectedCellIds.size > 0;

  const selectCell = useCallback((cellId: string, shiftKey: boolean, ctrlKey: boolean) => {
    if (!layout) return;

    if (shiftKey && anchorCellId) {
      const anchorCell = layout.cells.find(c => c.id === anchorCellId);
      const currentCell = layout.cells.find(c => c.id === cellId);

      if (anchorCell && currentCell) {
        const minRow = Math.min(anchorCell.row, currentCell.row);
        const maxRow = Math.max(anchorCell.row, currentCell.row);
        const minCol = Math.min(anchorCell.col, currentCell.col);
        const maxCol = Math.max(anchorCell.col, currentCell.col);

        const cellsInRect = layout.cells
          .filter(c => 
            c.row >= minRow && c.row <= maxRow &&
            c.col >= minCol && c.col <= maxCol
          )
          .map(c => c.id);

        setSelectedCellIds(new Set(cellsInRect));
      }
    } else if (ctrlKey) {
      setSelectedCellIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(cellId)) {
          newSet.delete(cellId);
        } else {
          newSet.add(cellId);
        }
        return newSet;
      });
      setAnchorCellId(cellId);
    } else {
      setSelectedCellIds(new Set([cellId]));
      setAnchorCellId(cellId);
    }
  }, [layout, anchorCellId]);

  const clearSelection = useCallback(() => {
    setSelectedCellIds(new Set());
    setAnchorCellId(null);
  }, []);

  const isSelected = useCallback((cellId: string) => {
    return selectedCellIds.has(cellId);
  }, [selectedCellIds]);

  const selectAll = useCallback(() => {
    if (!layout) return;
    const allCellIds = layout.cells.map(c => c.id);
    setSelectedCellIds(new Set(allCellIds));
  }, [layout]);

  const selectGroup = useCallback((groupId: string) => {
    if (!layout) return;
    const groupCellIds = layout.cells
      .filter(c => c.groupId === groupId)
      .map(c => c.id);
    setSelectedCellIds(new Set(groupCellIds));
  }, [layout]);

  // Escape для снятия выделения
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  return {
    selectedCellIds,
    isSelectionMode,
    selectCell,
    clearSelection,
    isSelected,
    selectAll,
    selectGroup
  };
};
