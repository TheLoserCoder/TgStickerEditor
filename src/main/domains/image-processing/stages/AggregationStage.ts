import { IPipelineStage } from '../../pipeline/interfaces/IPipelineStage';
import { PipelineData } from '../../pipeline/core/PipelineData';
import { ConvertedFragment } from '../../../../shared/domains/image-processing/types';
import { ProcessingStage, StageWeight } from '../enums';

export class AggregationStage implements IPipelineStage<ConvertedFragment, ConvertedFragment> {
  readonly name = ProcessingStage.AGGREGATE;
  readonly weight = StageWeight.AGGREGATE;

  async *process(
    data: PipelineData<ConvertedFragment>,
    signal: AbortSignal
  ): AsyncGenerator<PipelineData<ConvertedFragment>> {
    if (signal.aborted) {
      throw new Error('Processing aborted');
    }

    yield data;
  }
}
