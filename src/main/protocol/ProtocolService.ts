import { app, protocol, net } from 'electron';
import { pathToFileURL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import { ProtocolScheme, ProtocolError } from './enums';
import { StickerPackFolderName } from '../../shared/domains/sticker-pack/enums';
import { ILoggerService } from '../../shared/domains/logger/interfaces/ILoggerService';

export class ProtocolService {
  constructor(private logger?: ILoggerService) {}

  registerHandlers(): void {
    protocol.handle(ProtocolScheme.STICKER_PACKS, async (request) => {
      try {
        const url = request.url.replace(`${ProtocolScheme.STICKER_PACKS}://`, '');
        const decodedUrl = decodeURIComponent(url);
        const baseDir = path.join(app.getPath('userData'), StickerPackFolderName.BASE);

        const parts = decodedUrl.split('/');
        if (parts.length === 0) {
          return new Response(null, { status: 400 });
        }

        const requestedFolder = parts[0];
        const folders = fs.readdirSync(baseDir);
        const actualFolder = folders.find(f => f.toLowerCase() === requestedFolder.toLowerCase());

        if (!actualFolder) {
          return new Response(null, { status: 404 });
        }

        const filePath = path.join(baseDir, actualFolder, ...parts.slice(1));

        if (!fs.existsSync(filePath)) {
          return new Response(null, { status: 404 });
        }

        return net.fetch(pathToFileURL(filePath).toString());
      } catch (error) {
        this.logger?.error(ProtocolError.HANDLER_ERROR, error);
        return new Response(null, { status: 500 });
      }
    });
  }
}
