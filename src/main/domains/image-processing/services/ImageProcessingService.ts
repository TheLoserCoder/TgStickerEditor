import { IImageProcessingService } from './IImageProcessingService';
import { ImageInput, ProcessingResult, ConvertedFragment, ProcessedFragment, GridFragmentData } from '../../../../../shared/domains/image-processing/types';
import { ITaskBalancerService } from '../../task-balancer/services/ITaskBalancerService';
import { ITempFileService } from '../../temp-file/services/ITempFileService';
import { IFileSystemService } from '../../filesystem/IFileSystemService';
import { IStickerPackService } from '../../sticker-pack/infrastructure/IStickerPackService';
import { PipelineOrchestrator } from '../../pipeline/core/PipelineOrchestrator';
import { DetectConvertStage } from '../stages/DetectConvertStage';
import { TrimStage } from '../stages/TrimStage';
import { RescaleStage } from '../stages/RescaleStage';
import { PreCompressionStage } from '../stages/PreCompressionStage';
import { FragmentationStage } from '../stages/FragmentationStage';
import { PaddingStage } from '../stages/PaddingStage';
import { ConvertToWebpStage } from '../stages/ConvertToWebpStage';
import { AggregationStage } from '../stages/AggregationStage';
import { IIPCBridge } from '../../ipc/interfaces/IIPCBridge';
import { ImageProcessingIPCChannel, ImageProcessingStage } from '../../../../shared/domains/image-processing/enums';
import { ProgressAggregator } from '../utils/ProgressAggregator';
import { appendFileSync } from 'fs';
import { join } from 'path';

const LOG_PATH = join(process.cwd(), 'progress.log');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

export class ImageProcessingService implements IImageProcessingService {
  constructor(
    private taskBalancer: ITaskBalancerService,
    private tempFileService: ITempFileService,
    private fileSystem: IFileSystemService,
    private stickerPackService: IStickerPackService,
    private ipcBridge: IIPCBridge
  ) {}

  async processImages(
    inputs: ImageInput[],
    signal?: AbortSignal
  ): Promise<ProcessingResult[]> {
    const sessionId = Date.now().toString();
    log(`\n\n=== PROCESSING START === sessionId=${sessionId}, imagesCount=${inputs.length}`);
    const abortController = signal ? undefined : new AbortController();
    const effectiveSignal = signal || abortController!.signal;

    const aggregationStage = new AggregationStage();

    const pipeline = PipelineOrchestrator
      .create<ImageInput>()
      .addStage(new DetectConvertStage(this.taskBalancer))
      .addStage(new TrimStage(this.taskBalancer))
      .addStage(new RescaleStage(this.taskBalancer))
      .addStage(new PreCompressionStage(this.taskBalancer))
      .addStage(new FragmentationStage(this.taskBalancer))
      .addStage(new PaddingStage(this.taskBalancer))
      .addStage(new ConvertToWebpStage(this.taskBalancer))
      .addStage(aggregationStage);

    const totalPoints = inputs.length * 10 * pipeline.getStagesCount();
    log(`Total points: ${totalPoints} (${inputs.length} images × 10 × ${pipeline.getStagesCount()} stages)`);

    const progressAggregator = new ProgressAggregator(
      inputs.length,
      pipeline.getStagesCount(),
      (progress) => {
        log(`PROGRESS UPDATE: ${progress.toFixed(2)}%`);
        this.ipcBridge.send(ImageProcessingIPCChannel.PROGRESS, {
          progress,
          currentStage: ImageProcessingStage.PROCESSING
        });
      }
    );

    pipeline.onProgress((info) => {
      log(`AGGREGATOR: adding ${info.points} points`);
      progressAggregator.addPoints(info.points);
    });

    try {
      const results = await pipeline.execute(inputs, sessionId, effectiveSignal);
      log(`=== PROCESSING END === resultsCount=${results.length}`);
      
      return this.aggregateFragments(results as unknown as ConvertedFragment[]);
    } catch (error) {
      log(`=== PROCESSING ERROR === ${error}`);
      await this.tempFileService.cleanupSession(sessionId);
      throw error;
    } finally {
      await this.tempFileService.cleanupSession(sessionId);
    }
  }

  private aggregateFragments(fragments: ConvertedFragment[]): ProcessingResult[] {
    const groupMap = new Map<string, ConvertedFragment[]>();

    for (const fragment of fragments) {
      const key = `${fragment.packId}_${fragment.groupId}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(fragment);
    }

    const results: ProcessingResult[] = [];
    for (const [, groupFragments] of groupMap) {
      const processedFragments: ProcessedFragment[] = groupFragments.map(f => ({
        id: f.fragmentId,
        fileName: f.fileName,
        tempPath: f.tempPath,
        groupId: f.groupId
      }));

      const gridData: GridFragmentData[] = groupFragments.map(f => ({
        id: f.fragmentId,
        groupId: f.groupId,
        row: f.row,
        col: f.col
      }));

      results.push({
        packId: groupFragments[0].packId,
        packType: groupFragments[0].packType,
        fragments: processedFragments,
        gridData
      });
    }

    return results;
  }
}
