export interface IWebpConverter {
  convert(inputPath: string, outputPath: string, isAnimated: boolean): Promise<number>;
  validateSize(fileSize: number, isAnimated: boolean): boolean;
}
