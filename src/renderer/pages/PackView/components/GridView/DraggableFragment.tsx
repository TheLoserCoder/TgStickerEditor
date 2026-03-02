import React, { useMemo, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { DraggableFragmentProps } from '../../types';
import { GridViewConstants } from './constants';
import styles from './GridView.module.css';

export const DraggableFragment: React.FC<DraggableFragmentProps> = React.memo(({
  fragmentId,
  fragmentPath,
  groupId,
  isDragging,
  isSelectionMode
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: fragmentId,
    data: {
      fragmentId,
      groupId
    },
    disabled: isSelectionMode
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? GridViewConstants.DRAG_OPACITY : 1,
    cursor: isSelectionMode ? 'default' : 'grab',
    userSelect: 'none',
    WebkitUserDrag: 'none',
    touchAction: 'none'
  };

  if (!fragmentPath) {
    return (
      <div
        ref={setNodeRef}
        className={styles.gridFragment}
        style={style}
        {...(!isSelectionMode ? listeners : {})}
        {...(!isSelectionMode ? attributes : {})}
      />
    );
  }

  const mediaUrl = fragmentPath;
  const isVideo = mediaUrl.endsWith('.webm') || mediaUrl.endsWith('.mp4');

  if (isVideo) {
    return (
      <video
        ref={setNodeRef}
        src={mediaUrl}
        className={styles.gridFragment}
        style={style}
        {...(!isSelectionMode ? listeners : {})}
        {...(!isSelectionMode ? attributes : {})}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  return (
    <img
      ref={setNodeRef}
      src={mediaUrl}
      alt=""
      className={styles.gridFragment}
      style={style}
      {...(!isSelectionMode ? listeners : {})}
      {...(!isSelectionMode ? attributes : {})}
      draggable={false}
    />
  );
});

DraggableFragment.displayName = 'DraggableFragment';
