export interface IAnimationDetector {
  isAnimated(filePath: string): Promise<boolean>;
  detectApng(filePath: string): Promise<boolean>;
}
