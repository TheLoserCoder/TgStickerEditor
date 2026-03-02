import React from 'react';
import { ImageIcon } from '@radix-ui/react-icons';
import { PREVIEW_FRAGMENTS_COUNT } from './constants';
import styles from './PackPreview.module.css';

interface PackPreviewProps {
  paths: string[];
}

export const PackPreview: React.FC<PackPreviewProps> = ({ paths }) => {
  if (paths.length === 0) {
    return (
      <div className={styles.emptyPreview}>
        <ImageIcon width="48" height="48" />
      </div>
    );
  }

  const cells = Array.from({ length: PREVIEW_FRAGMENTS_COUNT }, (_, i) => {
    const path = paths[i];
    
    if (!path) {
      return <div key={i} className={styles.emptyCell} />;
    }

    const isVideo = path.endsWith('.webm') || path.endsWith('.mp4');

    return (
      <div key={i} className={styles.cell}>
        {isVideo ? (
          <video src={path} className={styles.media} />
        ) : (
          <img src={path} alt="" className={styles.media} />
        )}
      </div>
    );
  });

  return <div className={styles.grid}>{cells}</div>;
};
