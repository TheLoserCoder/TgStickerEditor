import { ImageInput, ProcessingResult } from '../types';

export interface IImageProcessingService {
  processImages(inputs: ImageInput[]): Promise<ProcessingResult[]>;
}
