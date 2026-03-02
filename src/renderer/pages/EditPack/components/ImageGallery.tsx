import React from 'react';
import { Flex, IconButton } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';
import { useImageThumbnails } from '../hooks/useImageThumbnails';
import { GALLERY_CONSTANTS, GALLERY_LABELS, GALLERY_STYLES } from './galleryConstants';
import styles from './ImageGallery.module.css';

interface ImageItem {
  id: string;
  data: Blob | string;
}

interface ImageGalleryProps {
  images: ImageItem[];
  selectedImageId: string | null;
  onSelectImage: (imageId: string | null) => void;
  onRemoveImage: (imageId: string) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  selectedImageId,
  onSelectImage,
  onRemoveImage,
}) => {
  const thumbnails = useImageThumbnails(images);

  return (
    <div className={styles.container}>
      <Flex className={styles.gallery}>
        <div
          className={`${styles.item} ${styles.allButton}`}
          onClick={() => onSelectImage(null)}
          style={{
            borderColor: selectedImageId === null ? GALLERY_STYLES.SELECTED_BORDER_COLOR : GALLERY_STYLES.UNSELECTED_BORDER_COLOR,
            background: selectedImageId === null ? GALLERY_STYLES.SELECTED_BACKGROUND : GALLERY_STYLES.UNSELECTED_BACKGROUND,
          }}
        >
          <span>{GALLERY_LABELS.ALL_BUTTON}</span>
        </div>
        {images.map((image) => (
          <div key={image.id} className={styles.wrapper}>
            <div
              className={styles.item}
              onClick={() => onSelectImage(image.id)}
              style={{
                backgroundImage: `url(${thumbnails[image.id]})`,
                borderColor: selectedImageId === image.id ? GALLERY_STYLES.SELECTED_BORDER_COLOR : GALLERY_STYLES.UNSELECTED_BORDER_COLOR,
              }}
            />
            <div className={styles.deleteButton}>
              <IconButton
                size={GALLERY_CONSTANTS.ICON_BUTTON_SIZE}
                color={GALLERY_CONSTANTS.ICON_BUTTON_COLOR}
                variant={GALLERY_CONSTANTS.ICON_BUTTON_VARIANT}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage(image.id);
                }}
              >
                <TrashIcon />
              </IconButton>
            </div>
          </div>
        ))}
      </Flex>
    </div>
  );
};
