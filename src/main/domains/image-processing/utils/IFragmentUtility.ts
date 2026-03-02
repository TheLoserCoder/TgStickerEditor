export interface IFragmentUtility {
  fragment(
    inputPath: string,
    outputDir: string,
    columns: number,
    rows: number,
    cellSize: number
  ): Promise<Array<{ path: string; row: number; col: number; width: number; height: number }>>;
}
