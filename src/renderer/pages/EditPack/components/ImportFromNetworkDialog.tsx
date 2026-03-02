import React, { useState } from 'react';
import { Dialog, Flex, TextField, Button, Text, Progress, Callout } from '@radix-ui/themes';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useStickerDownloader } from '@/renderer/hooks/useStickerDownloader';
import { ImageEditorImage } from '../../useImageEditorSettings';
import { ipcProxy } from '@/renderer/domains/ipc';
import { ITempFileService } from '@/shared/domains/temp-file/interfaces/ITempFileService';
import { TEMP_FILE_SERVICE_TOKEN } from '@/shared/domains/temp-file/constants';

interface ImportFromNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImagesLoaded: (images: ImageEditorImage[]) => void;
}

export const ImportFromNetworkDialog: React.FC<ImportFromNetworkDialogProps> = ({
  open,
  onOpenChange,
  onImagesLoaded
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const { downloadStickers, isDownloading, progress, message } = useStickerDownloader();
  
  const handleDownload = async () => {
    if (!url.trim()) return;
    
    setError('');
    const result = await downloadStickers(url.trim());
    
    if (result.success && result.filePaths) {
      // Читаем файлы через IPC
      const tempFileService = ipcProxy.wrap<ITempFileService>(TEMP_FILE_SERVICE_TOKEN);
      
      const images: ImageEditorImage[] = await Promise.all(
        result.filePaths.map(async (filePath, index) => {
          // Читаем файл как массив байтов
          const data = await tempFileService.readTempFileAsBlob(filePath);
          const blob = new Blob([new Uint8Array(data)]);
          
          // Получаем размеры изображения
          const img = new Image();
          const objectUrl = URL.createObjectURL(blob);
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              URL.revokeObjectURL(objectUrl);
              resolve();
            };
            img.onerror = reject;
            img.src = objectUrl;
          });
          
          return {
            id: `network_${Date.now()}_${index}`,
            data: blob,
            width: img.width,
            height: img.height
          };
        })
      );
      
      onImagesLoaded(images);
      onOpenChange(false);
      setUrl('');
      setError('');
    } else {
      setError(result.error || 'Не удалось скачать стикеры');
    }
  };
  
  const handleClose = () => {
    if (!isDownloading) {
      onOpenChange(false);
      setUrl('');
      setError('');
    }
  };
  
  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Импорт из сети</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Вставьте ссылку на стикерпак Line
        </Dialog.Description>
        
        <Flex direction="column" gap="3">
          <TextField.Root
            placeholder="https://store.line.me/stickershop/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isDownloading}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          
          {error && (
            <Callout.Root color="red" size="1">
              <Callout.Icon>
                <ExclamationTriangleIcon />
              </Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          
          {isDownloading && (
            <Flex direction="column" gap="2">
              <Progress value={progress} />
              <Text size="2" color="gray">{message}</Text>
            </Flex>
          )}
          
          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" disabled={isDownloading}>
                Отмена
              </Button>
            </Dialog.Close>
            <Button onClick={handleDownload} disabled={isDownloading || !url.trim()}>
              Скачать
            </Button>
          </Flex>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
};
