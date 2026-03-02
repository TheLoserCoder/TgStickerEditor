import { ProcessingSettings } from '../image-processing/types';

export interface EditorPreset {
  id: string;
  name: string;
  settings: ProcessingSettings;
}
