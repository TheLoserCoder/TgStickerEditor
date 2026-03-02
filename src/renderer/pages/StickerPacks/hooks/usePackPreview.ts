import { useState, useEffect } from 'react';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { Fragment } from '@/shared/domains/sticker-pack/types';
import { PREVIEW_FRAGMENTS_COUNT } from '../components/StickerPackCard/constants';

export const usePackPreview = (packId: string, fragments: Fragment[]) => {
  const [previewPaths, setPreviewPaths] = useState<string[]>([]);
  const facade = useStickerPackFacade();

  useEffect(() => {
    const loadPaths = async () => {
      const previewFragments = fragments.slice(0, PREVIEW_FRAGMENTS_COUNT);
      const pack = await facade.getPack(packId);
      
      if (!pack) return;

      const packFolderName = `${pack.name}_${pack.id}`;
      const paths: string[] = [];

      for (const fragment of previewFragments) {
        const fileName = await facade.getFragmentPath(packId, fragment.id);
        if (fileName) {
          paths.push(`sticker-packs://${packFolderName}/fragments/${fileName}`);
        }
      }

      setPreviewPaths(paths);
    };

    if (fragments.length > 0) {
      loadPaths();
    }
  }, [packId, fragments, facade]);

  return previewPaths;
};
