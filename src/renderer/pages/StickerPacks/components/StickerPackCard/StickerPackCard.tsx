import React from 'react';
import { Text, IconButton as RadixIconButton } from '@radix-ui/themes';
import { OpenInNewWindowIcon, TrashIcon } from '@radix-ui/react-icons';
import { StickerPackCardProps } from './types';
import { TYPE_LABELS, FRAGMENTS_LABEL } from './constants';
import { PackPreview } from './PackPreview';
import { usePackPreview } from '../../hooks/usePackPreview';
import styles from './StickerPackCard.module.css';

export const StickerPackCard: React.FC<StickerPackCardProps> = ({ 
  id,
  name, 
  type, 
  fragmentsCount,
  fragments,
  onClick, 
  onDelete, 
  onOpenFolder 
}) => {
  const previewPaths = usePackPreview(id, fragments);
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    onClick?.();
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {(onDelete || onOpenFolder) && (
        <div className={styles.actions}>
          {onOpenFolder && (
            <RadixIconButton
              size="1"
              variant="soft"
              onClick={(e) => {
                e.stopPropagation();
                onOpenFolder();
              }}
            >
              <OpenInNewWindowIcon />
            </RadixIconButton>
          )}
          {onDelete && (
            <RadixIconButton
              size="1"
              variant="soft"
              color="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <TrashIcon />
            </RadixIconButton>
          )}
        </div>
      )}
      <div className={styles.preview}>
        <PackPreview paths={previewPaths} />
      </div>
      <div className={styles.info}>
        <Text className={styles.name}>{name}</Text>
        <div className={styles.meta}>
          <Text>{TYPE_LABELS[type]}</Text>
          <Text>{fragmentsCount} {FRAGMENTS_LABEL}</Text>
        </div>
      </div>
    </div>
  );
};
