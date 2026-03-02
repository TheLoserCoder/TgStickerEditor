import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter
} from '@dnd-kit/core';
import { GridViewProps, DragData } from '../../types';
import { GridCell } from './GridCell';
import { GridViewConstants } from './constants';
import { getGroupColor } from '@/renderer/utils/color';
import { useGridSelection } from '../../hooks/useGridSelection';
import { useGridContextMenu } from '../../hooks/useGridContextMenu';
import { GridContextMenu } from './GridContextMenu';
import { GridContextAction } from './gridContextConstants';
import { isEmptyCell } from '@/shared/domains/grid/utils';
import styles from './GridView.module.css';

interface GridViewWithActionsProps extends GridViewProps {
  onCreateGroup: (cellIds: string[]) => void;
  onRemoveFromGroup: (cellIds: string[]) => void;
  onDeleteFragments: (fragmentIds: string[]) => void;
  onDeleteGroup: (groupId: string) => void;
  onDeleteGroupWithFragments: (groupId: string) => void;
  onDeleteGroupKeepFragments: (groupId: string) => void;
  onMoveSingleFragment: (fragmentId: string, row: number, col: number) => void;
  onClearSelectionReady: (callback: () => void) => void;
}

export const GridView: React.FC<GridViewWithActionsProps> = ({
  layout,
  fragmentPaths,
  onMoveGroup,
  onSwapFragments,
  onCreateGroup,
  onRemoveFromGroup,
  onDeleteFragments,
  onDeleteGroup,
  onDeleteGroupWithFragments,
  onDeleteGroupKeepFragments,
  onMoveSingleFragment,
  onClearSelectionReady
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [clickedCellId, setClickedCellId] = useState<string | null>(null);
  const { selectedCellIds, isSelectionMode, selectCell, clearSelection, isSelected, selectAll, selectGroup } = useGridSelection(layout);
  const contextMenuState = useGridContextMenu(selectedCellIds, layout, clickedCellId);

  useEffect(() => {
    onClearSelectionReady(clearSelection);
  }, [clearSelection, onClearSelectionReady]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: GridViewConstants.DRAG_DISTANCE
      }
    })
  );

  const gridStyle: React.CSSProperties = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${layout.columns}, ${GridViewConstants.CELL_SIZE}px)`,
    gap: `${GridViewConstants.CELL_GAP}px`,
    padding: '16px'
  }), [layout.columns]);

  const handleDragStart = (event: DragStartEvent) => {
    if (!isSelectionMode) {
      setDraggingId(event.active.id as string);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over || isSelectionMode) return;

    const activeData = active.data.current as DragData | undefined;
    if (!activeData) return;

    const overId = over.id as string;
    const parts = overId.split('_');
    if (parts.length !== 3) return;

    const targetRow = Number(parts[1]);
    const targetCol = Number(parts[2]);

    if (isNaN(targetRow) || isNaN(targetCol)) return;

    const sourceCell = layout.cells.find(c => c.fragmentId === activeData.fragmentId);
    const sourceGroupId = sourceCell?.groupId;

    const targetCell = layout.cells.find(c => c.row === targetRow && c.col === targetCol);
    const targetGroupId = targetCell?.groupId;
    const targetFragmentId = targetCell?.fragmentId;

    if (sourceGroupId === targetGroupId && targetFragmentId) {
      await onSwapFragments(activeData.fragmentId, targetFragmentId);
      return;
    }

    if (sourceGroupId && sourceGroupId !== 'default' && sourceCell) {
      const groupCells = layout.cells.filter(c => c.groupId === sourceGroupId && c.fragmentId !== null);
      const minGroupRow = Math.min(...groupCells.map(c => c.row));
      const minGroupCol = Math.min(...groupCells.map(c => c.col));
      
      const fragmentOffsetRow = sourceCell.row - minGroupRow;
      const fragmentOffsetCol = sourceCell.col - minGroupCol;

      const groupTargetRow = targetRow - fragmentOffsetRow;
      const groupTargetCol = targetCol - fragmentOffsetCol;

      const group = layout.groups.find(g => g.id === sourceGroupId);
      if (!group) return;

      const maxCol = Math.max(...groupCells.map(c => c.col));
      const groupWidth = maxCol - minGroupCol + 1;

      const adjustedCol = Math.max(0, Math.min(groupTargetCol, layout.columns - groupWidth));
      const adjustedRow = Math.max(0, groupTargetRow);

      await onMoveGroup(sourceGroupId, adjustedRow, adjustedCol);
    } else if (sourceGroupId === 'default' && sourceCell && !targetFragmentId) {
      await onMoveSingleFragment(activeData.fragmentId, targetRow, targetCol);
    }
  };

  const handleFragmentClick = useCallback((cellId: string, shiftKey: boolean, ctrlKey: boolean) => {
    setClickedCellId(cellId);
    selectCell(cellId, shiftKey, ctrlKey);
  }, [selectCell]);

  const handleContextAction = useCallback((action: GridContextAction) => {
    const fragmentIds = contextMenuState.effectiveFragmentIds;
    const cellIds = contextMenuState.effectiveCellIds;
    
    switch (action) {
      case GridContextAction.SELECT_ALL:
        selectAll();
        break;
      case GridContextAction.DESELECT_ALL:
        clearSelection();
        break;
      case GridContextAction.SELECT_GROUP:
        if (contextMenuState.groupId) {
          selectGroup(contextMenuState.groupId);
        }
        break;
      case GridContextAction.CREATE_GROUP:
        onCreateGroup(cellIds);
        break;
      case GridContextAction.DELETE_FRAGMENTS:
        onDeleteFragments(cellIds);
        break;
      case GridContextAction.REMOVE_FROM_GROUP:
        onRemoveFromGroup(cellIds);
        break;
      case GridContextAction.DELETE_GROUP:
        if (contextMenuState.hasMultipleGroups) {
          contextMenuState.affectedGroupIds.forEach(groupId => onDeleteGroup(groupId));
        } else if (contextMenuState.groupId) {
          onDeleteGroup(contextMenuState.groupId);
        }
        break;
      case GridContextAction.DELETE_GROUP_WITH_FRAGMENTS:
        if (contextMenuState.hasMultipleGroups) {
          const allFragmentIds = contextMenuState.affectedGroupIds.flatMap(groupId => {
            return layout.cells
              .filter(c => c.groupId === groupId && !isEmptyCell(c))
              .map(c => c.fragmentId);
          });
          onDeleteFragments(allFragmentIds);
        } else if (contextMenuState.groupId) {
          onDeleteGroupWithFragments(contextMenuState.groupId);
        }
        break;
      case GridContextAction.DELETE_GROUP_KEEP_FRAGMENTS:
        if (contextMenuState.hasMultipleGroups) {
          contextMenuState.affectedGroupIds.forEach(groupId => onDeleteGroupKeepFragments(groupId));
        } else if (contextMenuState.groupId) {
          onDeleteGroupKeepFragments(contextMenuState.groupId);
        }
        break;
    }
  }, [contextMenuState, onCreateGroup, onDeleteFragments, onRemoveFromGroup, onDeleteGroup, onDeleteGroupWithFragments, onDeleteGroupKeepFragments, clearSelection, selectAll, selectGroup]);

  const renderedCells = useMemo(() => {
    const cells = [];
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const cell = layout.cells.find(c => c.row === row && c.col === col);
        
        if (!cell) continue;

        const fragmentId = cell.fragmentId;
        const fragmentPath = !isEmptyCell(cell) ? fragmentPaths.get(fragmentId) || null : null;
        const group = cell.groupId !== 'default' ? (layout.groups.find(g => g.id === cell.groupId) || { id: cell.groupId, fragmentIds: [] }) : null;
        const groupColor = group ? getGroupColor(group.id) : null;
        const isDragging = draggingId === fragmentId;
        const selected = isSelected(cell.id);

        const stableKey = cell.id;

        cells.push(
          <GridCell
            key={stableKey}
            cell={cell}
            fragmentPath={fragmentPath}
            group={group}
            groupColor={groupColor}
            isDragging={isDragging}
            isSelected={selected}
            isSelectionMode={isSelectionMode}
            onFragmentClick={handleFragmentClick}
          />
        );
      }
    }
    return cells;
  }, [layout, fragmentPaths, draggingId, isSelected, isSelectionMode, handleFragmentClick]);

  const draggingFragmentPath = draggingId ? fragmentPaths.get(draggingId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <GridContextMenu
        selectedCount={contextMenuState.selectedCount}
        allInSameGroup={contextMenuState.allInSameGroup}
        hasGroup={contextMenuState.hasGroup}
        hasMultipleGroups={contextMenuState.hasMultipleGroups}
        totalFragments={layout.cells.length}
        onAction={handleContextAction}
      >
        <div className={styles.gridContainer} style={gridStyle} onClick={(e) => {
          if (e.target === e.currentTarget) {
            clearSelection();
          }
        }}>
          {renderedCells}
        </div>
      </GridContextMenu>

      <DragOverlay>
        {draggingFragmentPath && !isSelectionMode && (
          <div className={styles.dragOverlay}>
            {draggingFragmentPath.endsWith('.webm') || draggingFragmentPath.endsWith('.mp4') ? (
              <video
                src={draggingFragmentPath}
                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={draggingFragmentPath}
                alt=""
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
