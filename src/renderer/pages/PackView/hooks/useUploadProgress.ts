import { useState, useEffect } from 'react';
import { TelegramIPCChannel } from '@/shared/domains/telegram/enums';
import { UploadStage } from '../constants';

interface ProgressData {
  current: number;
  total: number;
}

export const useUploadProgress = () => {
  const [uploadProgress, setUploadProgress] = useState<ProgressData>({ current: 0, total: 0 });
  const [deleteProgress, setDeleteProgress] = useState<ProgressData>({ current: 0, total: 0 });
  const [uploadStage, setUploadStage] = useState<UploadStage | null>(null);

  useEffect(() => {
    const unsubscribeUpload = window.electron.ipc.on(TelegramIPCChannel.UPLOAD_PROGRESS, (data: ProgressData) => {
      setUploadStage(UploadStage.UPLOADING);
      setUploadProgress({ current: data.current, total: data.total });
    });
    
    const unsubscribeDelete = window.electron.ipc.on(TelegramIPCChannel.DELETE_PROGRESS, (data: ProgressData) => {
      setUploadStage(UploadStage.DELETING);
      setDeleteProgress({ current: data.current, total: data.total });
    });
    
    return () => {
      unsubscribeUpload();
      unsubscribeDelete();
    };
  }, []);

  const resetProgress = () => {
    setUploadStage(null);
    setUploadProgress({ current: 0, total: 0 });
    setDeleteProgress({ current: 0, total: 0 });
  };

  return {
    uploadProgress,
    deleteProgress,
    uploadStage,
    setUploadStage,
    resetProgress,
  };
};
