export interface IEmptyImageGenerator {
  generate(size: number): Promise<Buffer>;
}
