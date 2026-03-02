import { container } from '../core/Container';
import { FileSystemServiceToken } from './enums';
import { FileSystemService } from './services/FileSystemService';

import { IFileSystemService } from './services/IFileSystemService';

container.register(FileSystemServiceToken.SERVICE, async () => {
  return new FileSystemService();
});

export { FileSystemServiceToken };
