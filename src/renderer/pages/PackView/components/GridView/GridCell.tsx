import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { GridCellProps } from '../../types';
import { DraggableFragment } from './DraggableFragment';
import styles from './GridView.module.css';

export const GridCell: React.FC<GridCellProps> = ({
  cell,
  fragmentPath,
  group,
  groupColor,
  isDragging,
  isSelected,
  isSelectionMode,
  onFragmentClick
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell_${cell.row}_${cell.col}`
  });

  const cellClasses = [styles.gridCell];
  
  if (isOver && !isSelectionMode) {
    cellClasses.push(styles.gridCellDragOver);
  }

  if (isSelected) {
    cellClasses.push(styles.gridCellSelected);
  }

  const cellStyle: React.CSSProperties = {
    borderColor: isSelected ? 'var(--accent-9)' : (groupColor || undefined)
  };

  const handleClick = (e: React.MouseEvent) => {
    if (onFragmentClick) {
      onFragmentClick(cell.id, e.shiftKey, e.ctrlKey || e.metaKey);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={cellClasses.join(' ')}
      style={cellStyle}
      data-row={cell.row}
      data-col={cell.col}
      onClick={handleClick}
    >
      {(fragmentPath || cell.groupId !== 'default') && (
        <DraggableFragment
          fragmentId={cell.fragmentId}
          fragmentPath={fragmentPath}
          groupId={cell.groupId}
          isDragging={isDragging}
          isSelectionMode={isSelectionMode}
        />
      )}
    </div>
  );
};
