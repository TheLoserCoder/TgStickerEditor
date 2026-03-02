import React from 'react';
import { useCanvasDimensions } from '../hooks/useCanvasDimensions';
import { CANVAS_CONSTANTS, CANVAS_LABELS, GRID_CONSTANTS } from './constants';
import styles from './Canvas.module.css';

interface CanvasProps {
  imageSrc: string;
  columns: number;
  rows: number;
  zoom: number;
}

export const Canvas: React.FC<CanvasProps> = ({ imageSrc, columns, rows, zoom }) => {
  const dimensions = useCanvasDimensions(imageSrc, columns, rows);

  if (!dimensions) return null;

  const sectionSize = dimensions.canvasWidth / columns;
  const sectionHeight = dimensions.canvasHeight / rows;

  return (
    <div className={styles.viewport}>
      <div
        className={styles.canvas}
        style={{
          width: dimensions.canvasWidth,
          height: dimensions.canvasHeight,
          transform: `scale(${zoom / CANVAS_CONSTANTS.ZOOM_SCALE_DIVISOR})`,
        }}
      >
        <img
          src={imageSrc}
          alt={CANVAS_LABELS.IMAGE_ALT}
          className={styles.image}
          style={{
            width: dimensions.imageWidth,
            height: dimensions.imageHeight,
            left: dimensions.imageOffsetX,
            top: dimensions.imageOffsetY,
          }}
        />
        <svg className={styles.grid} width={dimensions.canvasWidth} height={dimensions.canvasHeight}>
          {Array.from({ length: columns - 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={(i + 1) * sectionSize}
              y1={0}
              x2={(i + 1) * sectionSize}
              y2={dimensions.canvasHeight}
              stroke="currentColor"
              strokeWidth={GRID_CONSTANTS.STROKE_WIDTH}
            />
          ))}
          {Array.from({ length: rows - 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1={0}
              y1={(i + 1) * sectionHeight}
              x2={dimensions.canvasWidth}
              y2={(i + 1) * sectionHeight}
              stroke="currentColor"
              strokeWidth={GRID_CONSTANTS.STROKE_WIDTH}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
