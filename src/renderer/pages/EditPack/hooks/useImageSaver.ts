import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageInput, ProcessedFragment, GridFragmentData } from '@/shared/domains/image-processing/types';
import { ProcessingSettings } from '@/shared/domains/image-processing/types';
import { StickerPackType } from '@/shared/domains/sticker-pack/enums';
import { RescaleQuality as SharedRescaleQuality } from '@/shared/domains/image-processing/enums';
import { useImageProcessing } from './useImageProcessing';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { ImageEditorImage, ImageEditorSettings } from '../useImageEditorSettings';
import { RescaleQuality } from '@/renderer/config/imageEditor.config';
import { ipcProxy } from '@/renderer/domains/ipc';
import { ITempFileService } from '@/shared/domains/temp-file/interfaces/ITempFileService';
import { TEMP_FILE_SERVICE_TOKEN } from '@/shared/domains/temp-file/constants';

export const useImageSaver = (
  packId: string,
  packType: StickerPackType,
  getSettingsForImage: (imageId: string) => ImageEditorSettings
) => {
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');
  const { processImages } = useImageProcessing();
  const stickerPackFacade = useStickerPackFacade();
  const navigate = useNavigate();
  const tempFileService = ipcProxy.wrap<ITempFileService>(TEMP_FILE_SERVICE_TOKEN);

  const saveImages = useCallback(
    async (images: ImageEditorImage[]) => {
      setIsSaving(true);
      setProgress(0);

      try {
        const mapRescaleQuality = (quality: RescaleQuality): SharedRescaleQuality => {
          switch (quality) {
            case RescaleQuality.SHARP:
              return SharedRescaleQuality.LANCZOS3;
            case RescaleQuality.SMOOTH:
              return SharedRescaleQuality.NEAREST;
            case RescaleQuality.NONE:
            default:
              return SharedRescaleQuality.NONE;
          }
        };

        const inputs: ImageInput[] = await Promise.all(
          images.map(async (image) => {
            let filePath: string;

            if (typeof image.data === 'string') {
              filePath = image.data;
            } else {
              const arrayBuffer = await image.data.arrayBuffer();
              const buffer = Array.from(new Uint8Array(arrayBuffer));
              const ext = image.data.type.split('/')[1] || 'png';
              const tempFileName = `temp_${image.id}.${ext}`;
              filePath = await tempFileService.saveBlobToTemp(buffer, tempFileName);
            }

            const fileName = filePath.split('/').pop()?.split('\\').pop()?.replace(/\.[^.]+$/, '') || `image_${image.id}`;
            const imageSettings = getSettingsForImage(image.id);

            const settings: ProcessingSettings = {
              enableAnimation: imageSettings.animation,
              enableTrim: imageSettings.crop,
              rescaleQuality: mapRescaleQuality(imageSettings.rescaleQuality),
              fragmentColumns: imageSettings.columns,
              fragmentRows: imageSettings.rows,
            };

            return {
              filePath,
              originalFileName: fileName,
              packId,
              packType,
              groupId: image.id,
              settings,
            };
          })
        );

        const results = await processImages(inputs, (info) => {
          setProgress(info.progress);
          setCurrentStage(info.currentStage);
        });

        // Последовательное сохранение результатов для избежания race condition в Grid
        for (const result of results) {
          if (result.fragments.length > 0) {
            await stickerPackFacade.addFragments(packId, result.fragments, result.gridData);
          }
        }

        setProgress(100);
        navigate(`/pack/${packId}`);
      } catch (error) {
        console.error('Failed to save images:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [packId, packType, processImages, stickerPackFacade, navigate, tempFileService, getSettingsForImage]
  );

  return { saveImages, isSaving, progress, currentStage };
};
