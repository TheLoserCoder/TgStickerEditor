import { useState, useEffect } from 'react';

interface ImageItem {
  id: string;
  data: Blob | string;
}

export const useImageThumbnails = (images: ImageItem[]) => {
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const newThumbnails: Record<string, string> = {};
    
    images.forEach((image) => {
      if (typeof image.data === 'string') {
        newThumbnails[image.id] = image.data;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          setThumbnails((prev) => ({
            ...prev,
            [image.id]: e.target?.result as string,
          }));
        };
        reader.readAsDataURL(image.data);
      }
    });

    if (Object.keys(newThumbnails).length > 0) {
      setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
    }
  }, [images]);

  return thumbnails;
};
