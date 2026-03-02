import { useState, useCallback } from 'react';
import { useTelegramUploader } from '@/renderer/hooks/useTelegramUploader';
import { TelegramStickerType } from '@/shared/domains/telegram/enums';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';
import { Bot } from '@/shared/domains/bot/types';
import { UploadStage } from '../constants';

interface UseTelegramUploadParams {
  pack: StickerPackManifest | null;
  packId: string | undefined;
  bots: Bot[];
  onSuccess: () => Promise<void>;
  setUploadStage: (stage: UploadStage | null) => void;
  resetProgress: () => void;
}

import { PACK_VIEW_LABELS } from '../constants';

export const useTelegramUpload = ({
  pack,
  packId,
  bots,
  onSuccess,
  setUploadStage,
  resetProgress,
}: UseTelegramUploadParams) => {
  const { uploadPack, updatePack } = useTelegramUploader();
  const [uploading, setUploading] = useState(false);

  const handleUpdate = useCallback(async () => {
    if (!pack || !packId || !pack.telegramPack) {
      console.warn('handleUpdate: missing required data', { pack: !!pack, packId, telegramPack: !!pack?.telegramPack });
      return;
    }
    
    if (bots.length === 0) {
      console.warn('handleUpdate: bots not loaded yet');
      return;
    }
    
    setUploading(true);
    resetProgress();

    try {
      // Используем botId из манифеста, если есть, иначе берем первого доступного бота
      const botId = pack.telegramPack.botId || bots[0]?.id;
      const bot = bots.find(b => b.id === botId);
      
      if (!bot) {
        console.error(PACK_VIEW_LABELS.BOT_NOT_FOUND, {
          requiredBotId: botId,
          availableBots: bots.map(b => ({ id: b.id, name: b.name }))
        });
        return;
      }

      const result = await updatePack({
        packId,
        botId: bot.id,
        botToken: bot.token,
        userId: bot.userId,
      });

      if (result.success) {
        await onSuccess();
      }
    } catch (error) {
      console.error(PACK_VIEW_LABELS.UPDATE_FAILED, error);
    } finally {
      setUploading(false);
      setUploadStage(null);
    }
  }, [pack, packId, bots, updatePack, onSuccess, setUploadStage, resetProgress]);

  const handleUpload = useCallback(async (data: { name: string; slug: string; botId: string }) => {
    if (!pack || !packId) return;
    
    setUploading(true);
    setUploadStage(UploadStage.UPLOADING);
    resetProgress();

    try {
      const bot = bots.find(b => b.id === data.botId);
      if (!bot) throw new Error(PACK_VIEW_LABELS.BOT_NOT_FOUND);

      const result = await uploadPack({
        packId,
        botId: data.botId,
        botToken: bot.token,
        userId: bot.userId,
        packName: data.slug,
        packTitle: data.name,
        stickerType: pack.type === 'EMOJI' ? TelegramStickerType.CUSTOM_EMOJI : TelegramStickerType.REGULAR,
      });

      if (result.success) {
        await onSuccess();
      }
    } catch (error) {
      console.error(PACK_VIEW_LABELS.UPLOAD_FAILED, error);
    } finally {
      setUploading(false);
      setUploadStage(null);
    }
  }, [pack, packId, bots, uploadPack, onSuccess, setUploadStage, resetProgress]);

  return {
    uploading,
    handleUpdate,
    handleUpload,
  };
};
