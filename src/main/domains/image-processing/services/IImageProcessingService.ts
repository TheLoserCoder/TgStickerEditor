import { ImageInput, ProcessingResult } from '../../../../../shared/domains/image-processing/types';

export interface IImageProcessingService {
  processImages(
    inputs: ImageInput[],
    signal?: AbortSignal
  ): Promise<ProcessingResult[]>;
}
