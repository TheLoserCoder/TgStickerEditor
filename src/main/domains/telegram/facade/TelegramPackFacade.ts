import { ITelegramPackFacade, UploadPackRequest } from '@/shared/domains/telegram/interfaces/ITelegramPackFacade';
import { UploadResult } from '@/shared/domains/telegram/types';
import { TelegramUploadStatus, TelegramStickerFormat, TelegramStickerType } from '@/shared/domains/telegram/enums';
import { IStickerPackFacade } from '../../sticker-pack/facade/IStickerPackFacade';
import { IManifestService } from '../../sticker-pack/manifest/IManifestService';
import { IFileSystemService } from '../../filesystem/services/IFileSystemService';
import { IEmptyImageGenerator } from '../utils/IEmptyImageGenerator';
import { GrammyAdapter } from '../adapters/GrammyAdapter';
import { gridToFlatArray, isEmptyCell } from '@/shared/domains/grid/utils';
import { TELEGRAM_UPLOAD_DELAY, TELEGRAM_PACK_URL_BASE, TELEGRAM_DEFAULT_EMOJI, TELEGRAM_STICKER_SIZE, TELEGRAM_FILE_EXTENSIONS, TELEGRAM_ERROR_MESSAGES, TELEGRAM_USER_ERROR_MESSAGES } from '@/shared/domains/telegram/constants';
import { TelegramError } from '@/shared/domains/telegram/enums';
import { IIPCBridge } from '../../ipc/interfaces/IIPCBridge';
import { TelegramIPCChannel } from '@/shared/domains/telegram/enums';

export class TelegramPackFacade implements ITelegramPackFacade {
  constructor(
    private stickerPackFacade: IStickerPackFacade,
    private manifestService: IManifestService,
    private fileSystem: IFileSystemService,
    private emptyImageGenerator: IEmptyImageGenerator,
    private ipcBridge: IIPCBridge
  ) {}

  async uploadPack(request: UploadPackRequest): Promise<UploadResult> {
    const pack = await this.stickerPackFacade.getPack(request.packId);
    
    if (!pack || !pack.gridLayout) {
      return { success: false, error: 'Пак или сетка не найдены' };
    }

    if (!request.botToken || !request.userId || !request.packName || !request.packTitle || !request.stickerType || !request.botId) {
      return { success: false, error: 'Недостаточно данных для загрузки' };
    }

    const adapter = new GrammyAdapter(request.botToken);
    const packPath = await this.stickerPackFacade.getStickerPackPath(request.packId);
    const flatCells = gridToFlatArray(pack.gridLayout);

    try {
      if (flatCells.length === 0) {
        return { success: false, error: 'Нет ячеек для загрузки' };
      }

      const bot = await adapter['bot'].api.getMe();
      const finalPackName = this.ensurePackNameSuffix(request.packName, bot.username);

      await this.manifestService.update(packPath, {
        telegramPack: {
          status: TelegramUploadStatus.UPLOADING,
          name: finalPackName,
          url: null,
          botId: request.botId,
          userId: request.userId
        }
      });

      const firstCell = flatCells[0];
      const firstFragment = isEmptyCell(firstCell) ? null : pack.fragments.find(f => f.id === firstCell.fragmentId);
      
      await this.createStickerSet(adapter, request, finalPackName, firstCell, firstFragment, packPath);
      await this.uploadStickersToSet(adapter, request, finalPackName, flatCells.slice(1), pack, packPath, 1);

      await this.manifestService.update(packPath, {
        telegramPack: {
          status: TelegramUploadStatus.UPLOADED,
          name: finalPackName,
          url: `${TELEGRAM_PACK_URL_BASE}${finalPackName}`,
          botId: request.botId,
          userId: request.userId
        }
      });

      const packUrl = `${TELEGRAM_PACK_URL_BASE}${finalPackName}`;
      return { success: true, packUrl };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async updatePack(request: UploadPackRequest): Promise<UploadResult> {
    const pack = await this.stickerPackFacade.getPack(request.packId);
    
    if (!pack || !pack.gridLayout) {
      return { success: false, error: 'Пак или сетка не найдены' };
    }

    if (!pack.telegramPack || !pack.telegramPack.name || !pack.telegramPack.userId) {
      return { success: false, error: 'Пак еще не был загружен в Telegram' };
    }

    const botToken = request.botToken;
    if (!botToken) {
      return { success: false, error: 'Не указан токен бота' };
    }

    const adapter = new GrammyAdapter(botToken);
    const packPath = await this.stickerPackFacade.getStickerPackPath(request.packId);
    const flatCells = gridToFlatArray(pack.gridLayout);

    try {
      const stickerSet = await adapter.getStickerSet(pack.telegramPack.name);
      if (!stickerSet) {
        return { success: false, error: 'Стикерпак не найден в Telegram' };
      }

      // Удаляем все стикеры кроме последнего (нельзя удалить последний)
      const stickerIds = stickerSet.stickers.map(s => s.file_id);
      const totalToDelete = stickerIds.length - 1;
      
      for (let i = 0; i < totalToDelete; i++) {
        await adapter.deleteStickerFromSet(stickerIds[i]);
        this.ipcBridge.send(TelegramIPCChannel.DELETE_PROGRESS, { 
          current: i + 1, 
          total: totalToDelete 
        });
        await this.delay(TELEGRAM_UPLOAD_DELAY);
      }

      // Загружаем все ячейки из сетки
      const userId = request.userId || pack.telegramPack.userId;
      const stickerType = pack.type === 'EMOJI' 
        ? TelegramStickerType.CUSTOM_EMOJI 
        : TelegramStickerType.REGULAR;
      
      // Сбрасываем прогресс загрузки перед началом
      this.ipcBridge.send(TelegramIPCChannel.UPLOAD_PROGRESS, { current: 0, total: flatCells.length });
      
      await this.uploadStickersToSet(adapter, { ...request, userId, stickerType }, pack.telegramPack.name, flatCells, pack, packPath, 0);

      // Удаляем последний старый стикер
      await adapter.deleteStickerFromSet(stickerIds[stickerIds.length - 1]);

      // Обновляем манифест с botId и userId (для миграции старых паков)
      const botId = request.botId || pack.telegramPack.botId;
      
      await this.manifestService.update(packPath, {
        telegramPack: {
          ...pack.telegramPack,
          botId,
          userId
        }
      });

      const packUrl = `${TELEGRAM_PACK_URL_BASE}${pack.telegramPack.name}`;
      return { success: true, packUrl };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private async uploadStickersToSet(
    adapter: GrammyAdapter,
    request: UploadPackRequest,
    packName: string,
    cells: any[],
    pack: any,
    packPath: string,
    startProgress: number
  ): Promise<void> {
    let progress = startProgress;
    const totalCells = cells.length + startProgress;

    this.emitProgress(progress, totalCells);

    for (const cell of cells) {
      await this.delay(TELEGRAM_UPLOAD_DELAY);

      const fragment = isEmptyCell(cell) ? null : pack.fragments.find((f: any) => f.id === cell.fragmentId);
      
      if (isEmptyCell(cell)) {
        await this.uploadEmptyCell(adapter, request, packName);
      } else {
        await this.uploadCell(adapter, request, packName, cell, fragment, packPath);
      }

      progress++;
      this.emitProgress(progress, totalCells);
    }
  }

  private async createStickerSet(
    adapter: GrammyAdapter,
    request: UploadPackRequest,
    packName: string,
    cell: any,
    fragment: any,
    packPath: string
  ): Promise<void> {
    const size = this.getEmptyImageSize(request.stickerType);
    const buffer = isEmptyCell(cell)
      ? await this.emptyImageGenerator.generate(size)
      : await this.fileSystem.readFile(`${packPath}/fragments/${fragment.fileName}`);

    const format = isEmptyCell(cell) ? TelegramStickerFormat.STATIC : this.detectFormat(fragment.fileName);

    await adapter.createStickerSet(
      request.userId,
      packName,
      request.packTitle,
      buffer,
      TELEGRAM_DEFAULT_EMOJI,
      format,
      request.stickerType
    );
  }

  private async uploadCell(
    adapter: GrammyAdapter,
    request: UploadPackRequest,
    packName: string,
    cell: any,
    fragment: any,
    packPath: string
  ): Promise<string> {
    const buffer = await this.fileSystem.readFile(`${packPath}/fragments/${fragment.fileName}`);
    const format = this.detectFormat(fragment.fileName);

    return await adapter.addStickerToSet(
      request.userId,
      packName,
      buffer,
      TELEGRAM_DEFAULT_EMOJI,
      format
    );
  }

  private async uploadEmptyCell(
    adapter: GrammyAdapter,
    request: UploadPackRequest,
    packName: string
  ): Promise<string> {
    const size = this.getEmptyImageSize(request.stickerType);
    const buffer = await this.emptyImageGenerator.generate(size);

    return await adapter.addStickerToSet(
      request.userId,
      packName,
      buffer,
      TELEGRAM_DEFAULT_EMOJI,
      TelegramStickerFormat.STATIC
    );
  }

  private async reorderStickers(
    adapter: GrammyAdapter,
    packName: string,
    desiredOrder: string[]
  ): Promise<void> {
    const stickerSet = await adapter.getStickerSet(packName);
    if (!stickerSet) return;

    const currentOrder = stickerSet.stickers.map(s => s.file_id);

    for (let i = 0; i < desiredOrder.length; i++) {
      const fileId = desiredOrder[i];
      const currentPos = currentOrder.indexOf(fileId);

      if (currentPos !== i && currentPos !== -1) {
        await adapter.setStickerPositionInSet(fileId, i);
        currentOrder.splice(currentPos, 1);
        currentOrder.splice(i, 0, fileId);
        await this.delay(TELEGRAM_UPLOAD_DELAY);
      }
    }
  }

  private getEmptyImageSize(stickerType: any): number {
    return stickerType === 'custom_emoji' ? TELEGRAM_STICKER_SIZE.EMOJI : TELEGRAM_STICKER_SIZE.STICKER;
  }

  private ensurePackNameSuffix(packName: string, botUsername: string): string {
    const suffix = `_by_${botUsername}`;
    return packName.endsWith(suffix) ? packName : `${packName}${suffix}`;
  }

  private detectFormat(filePath: string): TelegramStickerFormat {
    if (filePath.endsWith(TELEGRAM_FILE_EXTENSIONS.VIDEO)) return TelegramStickerFormat.VIDEO;
    if (filePath.endsWith(TELEGRAM_FILE_EXTENSIONS.ANIMATED)) return TelegramStickerFormat.ANIMATED;
    return TelegramStickerFormat.STATIC;
  }

  private emitProgress(current: number, total: number): void {
    this.ipcBridge.send(TelegramIPCChannel.UPLOAD_PROGRESS, { current, total });
  }

  private handleError(error: any): UploadResult {
    const errorMessage = error.message || error.description || TELEGRAM_USER_ERROR_MESSAGES.UNKNOWN;

    if (TELEGRAM_ERROR_MESSAGES.NETWORK.some(msg => errorMessage.includes(msg))) {
      return { 
        success: false, 
        error: TELEGRAM_USER_ERROR_MESSAGES.NETWORK, 
        errorCode: TelegramError.NETWORK_ERROR 
      };
    }

    if (TELEGRAM_ERROR_MESSAGES.PEER_INVALID.some(msg => errorMessage.includes(msg))) {
      return { 
        success: false, 
        error: TELEGRAM_USER_ERROR_MESSAGES.PEER_INVALID, 
        errorCode: TelegramError.PEER_ID_INVALID 
      };
    }

    if (TELEGRAM_ERROR_MESSAGES.DIMENSIONS.some(msg => errorMessage.includes(msg))) {
      return { 
        success: false, 
        error: TELEGRAM_USER_ERROR_MESSAGES.DIMENSIONS, 
        errorCode: TelegramError.STICKER_DIMENSIONS 
      };
    }

    if (TELEGRAM_ERROR_MESSAGES.NAME_TAKEN.some(msg => errorMessage.includes(msg))) {
      return { 
        success: false, 
        error: TELEGRAM_USER_ERROR_MESSAGES.NAME_TAKEN, 
        errorCode: TelegramError.PACK_NAME_OCCUPIED 
      };
    }

    return { 
      success: false, 
      error: `${TELEGRAM_USER_ERROR_MESSAGES.UNKNOWN}: ${errorMessage}`, 
      errorCode: TelegramError.UNKNOWN 
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
