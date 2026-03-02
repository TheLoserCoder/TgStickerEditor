import { useCallback, useMemo } from 'react';
import { ITelegramPackFacade, UploadPackRequest } from '@/shared/domains/telegram/interfaces/ITelegramPackFacade';
import { UploadResult } from '@/shared/domains/telegram/types';
import { TELEGRAM_SERVICE_TOKEN } from '@/main/domains/telegram/constants';
import { IPCServiceProxy } from '@/renderer/domains/ipc/services/IPCServiceProxy';

export function useTelegramUploader() {
  const service = useMemo(() => {
    const proxy = new IPCServiceProxy();
    return proxy.wrap<ITelegramPackFacade>(TELEGRAM_SERVICE_TOKEN);
  }, []);

  const uploadPack = useCallback(
    async (request: UploadPackRequest): Promise<UploadResult> => {
      return service.uploadPack(request);
    },
    [service]
  );

  const updatePack = useCallback(
    async (request: UploadPackRequest): Promise<UploadResult> => {
      return service.updatePack(request);
    },
    [service]
  );

  return {
    uploadPack,
    updatePack,
  };
}
