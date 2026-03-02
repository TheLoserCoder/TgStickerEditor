import { useMemo } from 'react';
import { IStickerPackFacade } from '@/shared/domains/sticker-pack/interfaces/IStickerPackFacade';
import { StickerPackServiceToken } from '@/shared/domains/sticker-pack/enums';
import { IPCServiceProxy } from '@/renderer/domains/ipc/services/IPCServiceProxy';

export const useStickerPackFacade = (): IStickerPackFacade => {
  return useMemo(() => {
    const proxy = new IPCServiceProxy();
    return proxy.wrap<IStickerPackFacade>(StickerPackServiceToken.FACADE);
  }, []);
};
