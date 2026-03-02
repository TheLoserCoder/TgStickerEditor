import { ManifestEntity } from './ManifestEntity';

export interface IManifestRepository {
  create(folderPath: string, manifest: ManifestEntity): Promise<ManifestEntity>;
  update(folderPath: string, manifest: ManifestEntity): Promise<ManifestEntity>;
  get(folderPath: string): Promise<ManifestEntity | null>;
}
