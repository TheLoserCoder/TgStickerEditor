export interface IGifCompressor {
  compress(inputPath: string, outputPath: string, targetDuration: number): Promise<void>;
}
