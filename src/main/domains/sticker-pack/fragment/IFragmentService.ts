import { Fragment } from '../../../../shared/domains/sticker-pack/types';

export interface IFragmentService {
  addFragment(folderPath: string, sourceFilePath: string, fileName: string, groupId?: string): Promise<Fragment>;
  addFragmentsBatch(folderPath: string, fragments: Array<{sourceFilePath: string; fileName: string; groupId?: string}>): Promise<Fragment[]>;
  removeFragment(folderPath: string, fragmentId: string): Promise<void>;
  removeFragmentsBatch(folderPath: string, fragmentIds: string[]): Promise<void>;
  updateFragmentGroup(folderPath: string, fragmentId: string, groupId: string | null): Promise<Fragment>;
  updateFragmentGroupBatch(folderPath: string, fragmentIds: string[], groupId: string | null): Promise<Fragment[]>;
  /** Возвращает имя файла фрагмента (не полный путь) */
  getFragmentPath(folderPath: string, fragmentId: string): Promise<string | null>;
}
