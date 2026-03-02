import { useState, useEffect } from 'react';
import { CANVAS_CONSTANTS } from '../components/constants';

interface CanvasDimensions {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
  imageOffsetX: number;
  imageOffsetY: number;
}

export const useCanvasDimensions = (imageSrc: string, columns: number, rows: number) => {
  const [dimensions, setDimensions] = useState<CanvasDimensions | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setDimensions(null);
      return;
    }

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const viewportW = window.innerWidth - CANVAS_CONSTANTS.SIDEBAR_WIDTH - CANVAS_CONSTANTS.PADDING;
      const viewportH = window.innerHeight - CANVAS_CONSTANTS.GALLERY_HEIGHT;
      const padding = CANVAS_CONSTANTS.VIEWPORT_PADDING;

      const maxCanvasW = viewportW - padding * 2;
      const maxCanvasH = viewportH - padding * 2;

      // Рассчитываем размер квадратной ячейки
      const maxCellSize = Math.min(maxCanvasW / columns, maxCanvasH / rows);
      
      const canvasW = maxCellSize * columns;
      const canvasH = maxCellSize * rows;

      // Изображение вписывается в сетку
      const scale = Math.min(canvasW / img.width, canvasH / img.height);
      const imgW = img.width * scale;
      const imgH = img.height * scale;

      setDimensions({
        canvasWidth: canvasW,
        canvasHeight: canvasH,
        imageWidth: imgW,
        imageHeight: imgH,
        imageOffsetX: (canvasW - imgW) / 2,
        imageOffsetY: (canvasH - imgH) / 2,
      });
    };
  }, [imageSrc, columns, rows]);

  return dimensions;
};
