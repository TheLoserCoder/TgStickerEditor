import { useState, useEffect, useMemo, useCallback } from 'react';
import { ipcProxy } from '@/renderer/domains/ipc';
import { IStickerDownloaderService } from '@/shared/domains/sticker-downloader/interfaces/IStickerDownloaderService';
import { DownloadResultDTO, DownloadProgressInfo } from '@/shared/domains/sticker-downloader/types';
import { StickerDownloaderIPCChannel } from '@/shared/domains/sticker-downloader/enums';
import { STICKER_DOWNLOADER_SERVICE_TOKEN } from '@/shared/domains/sticker-downloader/constants';

export function useStickerDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const downloaderService = useMemo(
    () => ipcProxy.wrap<IStickerDownloaderService>(
      STICKER_DOWNLOADER_SERVICE_TOKEN
    ),
    []
  );
  
  useEffect(() => {
    const handleProgress = (info: DownloadProgressInfo) => {
      setProgress(info.progress);
      setMessage(info.message);
    };
    
    const unsubscribe = window.electron.ipc.on(
      StickerDownloaderIPCChannel.PROGRESS,
      handleProgress
    );
    
    return unsubscribe;
  }, []);
  
  const downloadStickers = useCallback(
    async (url: string): Promise<DownloadResultDTO> => {
      setIsDownloading(true);
      setProgress(0);
      setMessage('');
      
      try {
        const result = await downloaderService.downloadStickers(url);
        return result;
      } finally {
        setIsDownloading(false);
      }
    },
    [downloaderService]
  );
  
  return {
    downloadStickers,
    isDownloading,
    progress,
    message
  };
}
