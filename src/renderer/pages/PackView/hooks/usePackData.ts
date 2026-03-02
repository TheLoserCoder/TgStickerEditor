import { useState, useCallback } from 'react';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';

export const usePackData = (packId: string | undefined) => {
  const facade = useStickerPackFacade();
  const [pack, setPack] = useState<StickerPackManifest | null>(null);

  const loadPack = useCallback(async () => {
    if (!packId) return null;

    const manifests = await facade.getAllPacks();
    const foundPack = manifests.find((p: StickerPackManifest) => p.id === packId);
    
    if (foundPack) {
      setPack(foundPack);
    }
    
    return foundPack;
  }, [packId, facade]);

  const refreshPack = useCallback(async () => {
    await loadPack();
  }, [loadPack]);

  return { pack, setPack, loadPack, refreshPack };
};
