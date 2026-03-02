import { useMemo } from 'react';
import { ISettingsService } from '@/shared/domains/settings/interfaces/ISettingsService';
import { SETTINGS_SERVICE_TOKEN } from '@/main/domains/settings/constants';
import { IPCServiceProxy } from '@/renderer/domains/ipc/services/IPCServiceProxy';

export const useSettingsService = (): ISettingsService => {
  return useMemo(() => {
    const proxy = new IPCServiceProxy();
    return proxy.wrap<ISettingsService>(SETTINGS_SERVICE_TOKEN);
  }, []);
};
