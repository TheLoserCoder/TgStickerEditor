import { useMemo } from 'react';
import { IEditorPresetService } from '@/shared/domains/editor-preset/interfaces/IEditorPresetService';
import { EDITOR_PRESET_SERVICE_TOKEN } from '@/main/domains/editor-preset/constants';
import { IPCServiceProxy } from '@/renderer/domains/ipc/services/IPCServiceProxy';

export const useEditorPresetService = (): IEditorPresetService => {
  return useMemo(() => {
    const proxy = new IPCServiceProxy();
    return proxy.wrap<IEditorPresetService>(EDITOR_PRESET_SERVICE_TOKEN);
  }, []);
};
