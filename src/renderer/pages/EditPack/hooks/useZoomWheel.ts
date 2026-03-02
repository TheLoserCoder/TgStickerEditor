import { useEffect } from 'react';
import { ZOOM_STEP, MIN_ZOOM, MAX_ZOOM } from '@/renderer/config/imageEditor.config';

export const useZoomWheel = (
  currentZoom: number,
  onZoomChange: (zoom: number) => void
) => {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
        
        if (newZoom !== currentZoom) {
          onZoomChange(newZoom);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentZoom, onZoomChange]);
};
