import { useCallback } from 'react';
import { ImageEditorImage } from '../useImageEditorSettings';

export const useFileUpload = (onImagesLoaded: (images: ImageEditorImage[]) => void) => {
  const handleLocalUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;

      const images: ImageEditorImage[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise<void>((resolve) => {
          img.onload = () => {
            images.push({
              id: `${Date.now()}-${i}`,
              data: file,
              width: img.width,
              height: img.height,
            });
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        });
      }

      if (images.length > 0) {
        onImagesLoaded(images);
      }
    };

    input.click();
  }, [onImagesLoaded]);

  return { handleLocalUpload };
};
