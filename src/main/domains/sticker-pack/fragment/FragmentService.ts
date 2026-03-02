import { IFragmentService } from './IFragmentService';
import { Fragment } from '@/shared/domains/sticker-pack/types';
import { IFragmentFileRepository } from './IFragmentFileRepository';
import { IManifestService } from '../manifest/IManifestService';
import { IIdGenerator } from '@/shared/utils/id-generator/interfaces/IIdGenerator';
import { FragmentEntity } from './FragmentEntity';
import { FragmentServiceError } from '../enums';

export class FragmentService implements IFragmentService {
  constructor(
    private fragmentFileRepo: IFragmentFileRepository,
    private manifestService: IManifestService,
    private idGenerator: IIdGenerator
  ) {}

  async addFragment(folderPath: string, sourceFilePath: string, fileName: string, groupId?: string): Promise<Fragment> {
    const fragmentId = this.idGenerator.generate();
    const fragment = FragmentEntity.create(fragmentId, fileName, groupId || null);

    await this.fragmentFileRepo.copyFile(folderPath, sourceFilePath, fileName);
    
    try {
      await this.manifestService.addFragmentToManifest(folderPath, fragment.toDTO());
    } catch (error) {
      await this.fragmentFileRepo.deleteFile(folderPath, fileName);
      throw error;
    }

    return fragment.toDTO();
  }

  async addFragmentsBatch(folderPath: string, fragments: Array<{sourceFilePath: string; fileName: string; groupId?: string}>): Promise<Fragment[]> {
    const createdFragments: Fragment[] = [];
    
    for (const frag of fragments) {
      const fragmentId = this.idGenerator.generate();
      const fragment = FragmentEntity.create(fragmentId, frag.fileName, frag.groupId || null);
      await this.fragmentFileRepo.copyFile(folderPath, frag.sourceFilePath, frag.fileName);
      createdFragments.push(fragment.toDTO());
    }
    
    try {
      await this.manifestService.addFragmentsBatch(folderPath, createdFragments);
    } catch (error) {
      for (const frag of createdFragments) {
        await this.fragmentFileRepo.deleteFile(folderPath, frag.fileName);
      }
      throw error;
    }

    return createdFragments;
  }

  async removeFragment(folderPath: string, fragmentId: string): Promise<void> {
    const fileName = await this.manifestService.removeFragmentFromManifest(folderPath, fragmentId);
    await this.fragmentFileRepo.deleteFile(folderPath, fileName);
  }

  async updateFragmentGroup(folderPath: string, fragmentId: string, groupId: string | null): Promise<Fragment> {
    await this.manifestService.updateFragmentGroupInManifest(folderPath, fragmentId, groupId);
    
    const fileName = await this.manifestService.getFragmentFileName(folderPath, fragmentId);
    if (!fileName) {
      throw new Error(FragmentServiceError.NOT_FOUND);
    }

    return { id: fragmentId, fileName, groupId };
  }

  async getFragmentPath(folderPath: string, fragmentId: string): Promise<string | null> {
    const fileName = await this.manifestService.getFragmentFileName(folderPath, fragmentId);
    if (!fileName) {
      return null;
    }

    return await this.fragmentFileRepo.getFilePath(folderPath, fileName);
  }

  async removeFragmentsBatch(folderPath: string, fragmentIds: string[]): Promise<void> {
    const fileNames = await this.manifestService.removeFragmentsBatch(folderPath, fragmentIds);
    
    for (const fileName of fileNames) {
      await this.fragmentFileRepo.deleteFile(folderPath, fileName);
    }
  }

  async updateFragmentGroupBatch(folderPath: string, fragmentIds: string[], groupId: string | null): Promise<Fragment[]> {
    await this.manifestService.updateFragmentGroupBatch(folderPath, fragmentIds, groupId);
    
    const fragments: Fragment[] = [];
    for (const fragmentId of fragmentIds) {
      const fileName = await this.manifestService.getFragmentFileName(folderPath, fragmentId);
      if (!fileName) {
        throw new Error(FragmentServiceError.NOT_FOUND);
      }
      fragments.push({ id: fragmentId, fileName, groupId });
    }
    
    return fragments;
  }
}
