export interface IStickerPackService {
  createPackInfrastructure(packId: string, title: string): Promise<string>;
  deletePackInfrastructure(packId: string): Promise<void>;
  getPackPath(packId: string): Promise<string | null>;
  getAllPackIds(): Promise<string[]>;
}
