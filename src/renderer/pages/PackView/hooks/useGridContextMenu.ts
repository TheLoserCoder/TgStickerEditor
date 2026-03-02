import { useMemo } from 'react';
import { GridLayout } from '@/shared/domains/grid/types';
import { isEmptyCell } from '@/shared/domains/grid/utils';

export const useGridContextMenu = (
  selectedCellIds: Set<string>,
  layout: GridLayout | null,
  clickedCellId: string | null
) => {
  const contextMenuState = useMemo(() => {
    const effectiveCellIds = selectedCellIds.size > 0 && clickedCellId && selectedCellIds.has(clickedCellId)
      ? Array.from(selectedCellIds)
      : clickedCellId ? [clickedCellId] : [];

    if (!layout || effectiveCellIds.length === 0) {
      return {
        selectedCount: 0,
        allInSameGroup: false,
        hasGroup: false,
        groupId: null,
        hasMultipleGroups: false,
        affectedGroupIds: [],
        effectiveFragmentIds: [],
        effectiveCellIds: []
      };
    }

    const cells = effectiveCellIds
      .map(id => layout.cells.find(c => c.id === id))
      .filter(Boolean);
    
    const fragmentIds = cells.filter(c => !isEmptyCell(c!)).map(c => c!.fragmentId);
    
    const groupIds = new Set(cells.map(c => c!.groupId).filter(g => g !== 'default'));
    const allInSameGroup = groupIds.size === 1;
    const firstCell = cells[0];
    const hasGroup = firstCell ? firstCell.groupId !== 'default' : false;
    const groupId = allInSameGroup && firstCell ? firstCell.groupId : null;
    const hasMultipleGroups = groupIds.size > 1;
    
    return {
      selectedCount: effectiveCellIds.length,
      allInSameGroup,
      hasGroup,
      groupId,
      hasMultipleGroups,
      affectedGroupIds: Array.from(groupIds),
      effectiveFragmentIds: fragmentIds,
      effectiveCellIds
    };
  }, [selectedCellIds, layout, clickedCellId]);

  return contextMenuState;
};
