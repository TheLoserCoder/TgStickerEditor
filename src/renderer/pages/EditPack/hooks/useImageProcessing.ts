import { useCallback, useEffect } from 'react';
import { ipcProxy } from '@/renderer/domains/ipc';
import { IImageProcessingService } from '@/shared/domains/image-processing/interfaces/IImageProcessingService';
import { ImageInput, ProcessingResult } from '@/shared/domains/image-processing/types';
import { IMAGE_PROCESSING_SERVICE_TOKEN } from '@/shared/domains/image-processing/constants';
import { ImageProcessingIPCChannel } from '@/shared/domains/image-processing/enums';
import { ProgressInfo } from '@/shared/domains/pipeline/types';

export const useImageProcessing = () => {
  const service = ipcProxy.wrap<IImageProcessingService>(IMAGE_PROCESSING_SERVICE_TOKEN);

  const processImages = useCallback(
    async (
      inputs: ImageInput[],
      onProgress?: (info: ProgressInfo) => void
    ): Promise<ProcessingResult[]> => {
      if (onProgress) {
        window.electron.ipc.on(ImageProcessingIPCChannel.PROGRESS, onProgress);
      }
      
      try {
        return await service.processImages(inputs);
      } finally {
        if (onProgress) {
          window.electron.ipc.removeListener?.(ImageProcessingIPCChannel.PROGRESS, onProgress);
        }
      }
    },
    [service]
  );

  return { processImages };
};
