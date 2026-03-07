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
    console.log('[TelegramPackFacade] uploadPack started', { packId: request.packId, packName: request.packName });
    
    const pack = await this.stickerPackFacade.getPack(request.packId);
    
    if (!pack || !pack.gridLayout) {
      console.error('[TelegramPackFacade] Pack or grid not found');
      return { success: false, error: 'Пак или сетка не найдены' };
    }

    if (!request.botToken || !request.userId || !request.packName || !request.packTitle || !request.stickerType || !request.botId) {
      console.error('[TelegramPackFacade] Missing required data');
      return { success: false, error: 'Недостаточно данных для загрузки' };
    }

    console.log('[TelegramPackFacade] Creating GrammyAdapter');
    const adapter = new GrammyAdapter(request.botToken);
    
    console.log('[TelegramPackFacade] Validating bot');
    const botValidation = await adapter.validateBot();
    console.log('[TelegramPackFacade] Bot validation result:', botValidation);
    
    if (!botValidation.isValid) {
      console.error('[TelegramPackFacade] Bot validation failed');
      return { success: false, error: 'Токен бота недействителен или бот неактивен' };
    }

    const packPath = await this.stickerPackFacade.getStickerPackPath(request.packId);
    const flatCells = gridToFlatArray(pack.gridLayout);

    try {
      if (flatCells.length === 0) {
        console.error('[TelegramPackFacade] No cells to upload');
        return { success: false, error: 'Нет ячеек для загрузки' };
      }

      const fullPackName = `${request.packName}_by_${botValidation.username}`;
      console.log('[TelegramPackFacade] Full pack name:', fullPackName);

      const firstCell = flatCells[0];
      const firstFragment = isEmptyCell(firstCell) ? null : pack.fragments.find(f => f.id === firstCell.fragmentId);
      
      console.log('[TelegramPackFacade] Creating sticker set');
      await this.createStickerSet(adapter, request, fullPackName, firstCell, firstFragment, packPath);
      console.log('[TelegramPackFacade] Sticker set created successfully');
      
      console.log('[TelegramPackFacade] Getting sticker set info');
      const stickerSet = await adapter.getStickerSet(fullPackName);
      if (!stickerSet) {
        console.error('[TelegramPackFacade] Failed to get created sticker set');
        return { success: false, error: 'Не удалось получить созданный стикерпак' };
      }
      
      const packUrl = `${TELEGRAM_PACK_URL_BASE}${stickerSet.name}`;
      console.log('[TelegramPackFacade] Pack URL:', packUrl);
      
      console.log('[TelegramPackFacade] Updating manifest with pack info');
      await this.manifestService.update(packPath, {
        telegramPack: {
          status: TelegramUploadStatus.UPLOADING,
          name: stickerSet.name,
          url: packUrl,
          botId: request.botId,
          userId: request.userId
        }
      });
      
      console.log('[TelegramPackFacade] Uploading remaining stickers');
      await this.uploadStickersToSet(adapter, request, fullPackName, flatCells.slice(1), pack, packPath, 1);

      console.log('[TelegramPackFacade] Updating manifest status to UPLOADED');
      await this.manifestService.update(packPath, {
        telegramPack: {
          status: TelegramUploadStatus.UPLOADED,
          name: stickerSet.name,
          url: packUrl,
          botId: request.botId,
          userId: request.userId
        }
      });

      console.log('[TelegramPackFacade] Sending success message to user');
      await adapter.sendMessage(request.userId, `Стикерпак успешно создан!\n${packUrl}`);

      console.log('[TelegramPackFacade] Upload completed successfully');
      return { success: true, packUrl };
    } catch (error: any) {
      console.error('[TelegramPackFacade] Upload error:', error);
      return this.handleError(error);
    }
  }

  async updatePack(request: UploadPackRequest): Promise<UploadResult> {
    console.log('[TelegramPackFacade] updatePack started', { packId: request.packId });
    
    const pack = await this.stickerPackFacade.getPack(request.packId);
    
    if (!pack || !pack.gridLayout) {
      console.error('[TelegramPackFacade] Pack or grid not found');
      return { success: false, error: 'Пак или сетка не найдены' };
    }

    if (!pack.telegramPack || !pack.telegramPack.name || !pack.telegramPack.userId) {
      console.error('[TelegramPackFacade] Pack not uploaded to Telegram');
      return { success: false, error: 'Пак еще не был загружен в Telegram' };
    }

    const botToken = request.botToken;
    if (!botToken) {
      console.error('[TelegramPackFacade] Bot token missing');
      return { success: false, error: 'Не указан токен бота' };
    }

    console.log('[TelegramPackFacade] Creating GrammyAdapter');
    const adapter = new GrammyAdapter(botToken);
    
    console.log('[TelegramPackFacade] Validating bot');
    const botValidation = await adapter.validateBot();
    if (!botValidation.isValid) {
      console.error('[TelegramPackFacade] Bot validation failed');
      return { success: false, error: 'Токен бота недействителен или бот неактивен' };
    }

    const packPath = await this.stickerPackFacade.getStickerPackPath(request.packId);
    const flatCells = gridToFlatArray(pack.gridLayout);
    console.log('[TelegramPackFacade] Total cells to upload:', flatCells.length);

    try {
      console.log('[TelegramPackFacade] Getting sticker set');
      const stickerSet = await adapter.getStickerSet(pack.telegramPack.name);
      if (!stickerSet) {
        console.error('[TelegramPackFacade] Sticker set not found');
        return { success: false, error: 'Стикерпак не найден в Telegram' };
      }

      console.log('[TelegramPackFacade] Deleting old stickers');
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

      const userId = request.userId || pack.telegramPack.userId;
      const stickerType = pack.type === 'EMOJI' 
        ? TelegramStickerType.CUSTOM_EMOJI 
        : TelegramStickerType.REGULAR;
      
      console.log('[TelegramPackFacade] Uploading all stickers');
      this.ipcBridge.send(TelegramIPCChannel.UPLOAD_PROGRESS, { current: 0, total: flatCells.length });
      
      await this.uploadStickersToSet(adapter, { ...request, userId, stickerType }, pack.telegramPack.name, flatCells, pack, packPath, 0);

      console.log('[TelegramPackFacade] Deleting last old sticker');
      await adapter.deleteStickerFromSet(stickerIds[stickerIds.length - 1]);

      const botId = request.botId || pack.telegramPack.botId;
      
      await this.manifestService.update(packPath, {
        telegramPack: {
          ...pack.telegramPack,
          botId,
          userId
        }
      });

      const packUrl = `${TELEGRAM_PACK_URL_BASE}${pack.telegramPack.name}`;
      
      console.log('[TelegramPackFacade] Sending success message');
      await adapter.sendMessage(userId, `Стикерпак успешно обновлен!\n${packUrl}`);

      console.log('[TelegramPackFacade] Update completed successfully');
      return { success: true, packUrl };
    } catch (error: any) {
      console.error('[TelegramPackFacade] Update error:', error);
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
    try {
      const buffer = await this.fileSystem.readFile(`${packPath}/fragments/${fragment.fileName}`);
      const format = this.detectFormat(fragment.fileName);
      console.log('[TelegramPackFacade] Uploading cell:', fragment.fileName);

      return await adapter.addStickerToSet(
        request.userId,
        packName,
        buffer,
        TELEGRAM_DEFAULT_EMOJI,
        format
      );
    } catch (error: any) {
      console.error('[TelegramPackFacade] Error uploading cell:', fragment?.fileName, error.message);
      return await this.uploadEmptyCell(adapter, request, packName);
    }
  }

  private async uploadEmptyCell(
    adapter: GrammyAdapter,
    request: UploadPackRequest,
    packName: string
  ): Promise<string> {
    try {
      const size = this.getEmptyImageSize(request.stickerType);
      const buffer = await this.emptyImageGenerator.generate(size);
      console.log('[TelegramPackFacade] Uploading empty cell');

      return await adapter.addStickerToSet(
        request.userId,
        packName,
        buffer,
        TELEGRAM_DEFAULT_EMOJI,
        TelegramStickerFormat.STATIC
      );
    } catch (error: any) {
      console.error('[TelegramPackFacade] Error uploading empty cell:', error.message);
      throw error;
    }
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
