import { IPipelineStage } from '../interfaces/IPipelineStage';
import { PipelineData } from './PipelineData';
import { TaskContext } from './TaskContext';
import { ProgressInfo } from '../types';
import { PipelineError } from '../enums';
import { appendFileSync } from 'fs';
import { join } from 'path';

const POINTS_PER_STAGE = 10;
const LOG_PATH = join(process.cwd(), 'progress.log');

function log(message: string): void {
  const timestamp = new Date().toISOString();
  appendFileSync(LOG_PATH, `[${timestamp}] ${message}\n`);
}

export class PipelineOrchestrator<TInput, TOutput> {
  private stages: IPipelineStage<any, any>[] = [];
  private progressCallback?: (info: ProgressInfo) => void;

  addStage<TNext>(
    stage: IPipelineStage<TOutput, TNext>
  ): PipelineOrchestrator<TInput, TNext> {
    this.stages.push(stage);
    return this as any;
  }

  onProgress(callback: (info: ProgressInfo) => void): this {
    this.progressCallback = callback;
    return this;
  }

  async execute(
    input: TInput,
    sessionId: string,
    signal: AbortSignal
  ): Promise<TOutput[]> {
    log(`=== PIPELINE START === sessionId=${sessionId}, stagesCount=${this.stages.length}`);

    try {
      // Если input - массив, запускаем параллельные pipeline для каждого элемента
      if (Array.isArray(input)) {
        log(`=== PARALLEL PIPELINES START === imagesCount=${input.length}`);
        
        const pipelines = input.map((item, index) => {
          const itemSessionId = `${sessionId}_${index}`;
          const context = new TaskContext(itemSessionId, { settings: (item as any).settings });
          const data = new PipelineData(item, context);
          return this.runSinglePipeline(data, signal);
        });
        
        const allResults = await Promise.all(pipelines);
        const results = allResults.flat();
        
        log(`=== PIPELINE END === sessionId=${sessionId}, resultsCount=${results.length}`);
        return results;
      }

      // Обычный последовательный pipeline для одного элемента
      const context = new TaskContext(sessionId, { settings: (input as any).settings });
      const initialData = new PipelineData(input, context);
      const results: TOutput[] = [];
      const generator = this.processChain(initialData, 0, signal);

      for await (const result of generator) {
        results.push(result.payload);
      }

      log(`=== PIPELINE END === sessionId=${sessionId}, resultsCount=${results.length}`);
      return results;
    } catch (error) {
      log(`=== PIPELINE ERROR === ${error}`);
      throw error;
    }
  }

  private async runSinglePipeline(
    data: PipelineData<any>,
    signal: AbortSignal
  ): Promise<TOutput[]> {
    const results: TOutput[] = [];
    const generator = this.processChain(data, 0, signal);
    
    for await (const result of generator) {
      results.push(result.payload);
    }
    
    return results;
  }

  getStagesCount(): number {
    return this.stages.length;
  }

  private async *processChain(
    data: PipelineData<any>,
    stageIndex: number,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<TOutput>> {
    if (signal.aborted) {
      throw new Error(PipelineError.ABORTED);
    }

    if (stageIndex >= this.stages.length) {
      yield data;
      return;
    }

    const stage = this.stages[stageIndex];
    const itemId = this.getItemId(data.payload);
    log(`STAGE START: stage=${stage.name}, stageIndex=${stageIndex}, itemId=${itemId}`);

    for await (const result of stage.process(data, signal)) {
      if (signal.aborted) {
        throw new Error(PipelineError.ABORTED);
      }

      const resultId = this.getItemId(result.payload);
      const points = result.context.metadata?.fragmentPoints as number || POINTS_PER_STAGE;
      log(`STAGE COMPLETE: stage=${stage.name}, itemId=${resultId}, points=${points}`);
      this.emitProgress(stage.name, points, resultId);

      if (stageIndex < this.stages.length - 1) {
        yield* this.processChain(result, stageIndex + 1, signal);
      } else {
        yield result;
      }
    }
  }

  private getItemId(payload: any): string {
    if (Array.isArray(payload)) {
      return `batch[${payload.length}]`;
    }
    return payload.fragmentId || payload.sessionId || payload.groupId || 'unknown';
  }

  private emitProgress(currentStage: string, points: number, itemId: string): void {
    if (!this.progressCallback) return;

    log(`PROGRESS EMIT: stage=${currentStage}, points=${points}, itemId=${itemId}`);
    this.progressCallback({
      currentStage,
      points
    });
  }

  static create<T>(): PipelineOrchestrator<T, T> {
    return new PipelineOrchestrator<T, T>();
  }
}
