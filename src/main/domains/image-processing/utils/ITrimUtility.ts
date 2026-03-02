export interface ITrimUtility {
  trimStatic(inputPath: string, outputPath: string): Promise<{ width: number; height: number }>;
  trimAnimated(inputPath: string, outputPath: string): Promise<{ width: number; height: number }>;
}
