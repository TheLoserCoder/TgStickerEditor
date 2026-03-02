/**
 * ProgressAggregator
 * Зона ответственности: Агрегация прогресса от pipeline
 * Система: 10 баллов за каждую стадию для каждого изображения
 */

const POINTS_PER_STAGE = 10;

export class ProgressAggregator {
  private completedPoints = 0;
  private readonly totalPoints: number;

  constructor(
    imageCount: number,
    stagesCount: number,
    private readonly callback: (progress: number) => void
  ) {
    this.totalPoints = imageCount * POINTS_PER_STAGE * stagesCount;
  }

  addPoints(points: number): void {
    this.completedPoints += points;
    const progress = Math.min(100, (this.completedPoints / this.totalPoints) * 100);
    this.callback(progress);
  }
}
