import { container } from '../core/Container';
import { AnimationDetector } from './utils/AnimationDetector';
import { GifCompressor } from './utils/GifCompressor';
import { TrimUtility } from './utils/TrimUtility';
import { RescaleUtility } from './utils/RescaleUtility';
import { FragmentUtility } from './utils/FragmentUtility';
import { WebpConverter } from './utils/WebpConverter';
import { ImageProcessingService } from './services/ImageProcessingService';
import {
  ANIMATION_DETECTOR_TOKEN,
  GIF_COMPRESSOR_TOKEN,
  TRIM_UTILITY_TOKEN,
  RESCALE_UTILITY_TOKEN,
  FRAGMENT_UTILITY_TOKEN,
  WEBP_CONVERTER_TOKEN,
  IMAGE_PROCESSING_SERVICE_TOKEN
} from './constants';
import { MEDIA_PROCESSING_TOKENS } from '../media-processing/constants';
import { FileSystemServiceToken } from '../filesystem/enums';
import { TASK_BALANCER_SERVICE_TOKEN } from '../task-balancer/constants';
import { TEMP_FILE_SERVICE_TOKEN } from '../temp-file/constants';
import { StickerPackServiceToken } from '../../../shared/domains/sticker-pack/enums';
import { getMainServiceFactory } from '../../factories/mainFactory';

container.register(ANIMATION_DETECTOR_TOKEN, async () => {
  const sharpAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER);
  const fileSystem = await container.resolve(FileSystemServiceToken.SERVICE);
  return new AnimationDetector(sharpAdapter, fileSystem);
});

container.register(GIF_COMPRESSOR_TOKEN, async () => {
  const ffmpegAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.FFMPEG_ADAPTER);
  return new GifCompressor(ffmpegAdapter);
});

container.register(TRIM_UTILITY_TOKEN, async () => {
  const sharpAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER);
  return new TrimUtility(sharpAdapter);
});

container.register(RESCALE_UTILITY_TOKEN, async () => {
  const sharpAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER);
  return new RescaleUtility(sharpAdapter);
});

container.register(FRAGMENT_UTILITY_TOKEN, async () => {
  const sharpAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER);
  return new FragmentUtility(sharpAdapter);
});

container.register(WEBP_CONVERTER_TOKEN, async () => {
  const sharpAdapter = await container.resolve(MEDIA_PROCESSING_TOKENS.SHARP_ADAPTER);
  const fileSystem = await container.resolve(FileSystemServiceToken.SERVICE);
  return new WebpConverter(sharpAdapter, fileSystem);
});

container.register(IMAGE_PROCESSING_SERVICE_TOKEN, async () => {
  const [taskBalancer, tempFileService, fileSystem, stickerPackService, ipcBridge, factory] = await Promise.all([
    container.resolve(TASK_BALANCER_SERVICE_TOKEN),
    container.resolve(TEMP_FILE_SERVICE_TOKEN),
    container.resolve(FileSystemServiceToken.SERVICE),
    container.resolve(StickerPackServiceToken.SERVICE),
    container.resolve('IPCBridge'),
    getMainServiceFactory(),
  ]);
  
  const service = new ImageProcessingService(
    taskBalancer,
    tempFileService,
    fileSystem,
    stickerPackService,
    ipcBridge
  );
  return factory.createService(service, IMAGE_PROCESSING_SERVICE_TOKEN);
});
