import { useMemo } from 'react';
import { IBotService } from '@/shared/domains/bot/interfaces/IBotService';
import { BOT_SERVICE_TOKEN } from '@/main/domains/bot/constants';
import { IPCServiceProxy } from '@/renderer/domains/ipc/services/IPCServiceProxy';

export const useBotService = (): IBotService => {
  return useMemo(() => {
    const proxy = new IPCServiceProxy();
    return proxy.wrap<IBotService>(BOT_SERVICE_TOKEN);
  }, []);
};
