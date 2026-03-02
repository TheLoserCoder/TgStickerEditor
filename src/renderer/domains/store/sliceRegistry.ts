/**
 * Реестр слайсов для маппинга domain → slice actions
 */

import * as botsSlice from './slices/botsSlice';
import * as settingsSlice from './slices/settingsSlice';
import * as stickerPacksSlice from './slices/stickerPacksSlice';
import * as manifestsSlice from './slices/manifestsSlice';

type SliceActions = {
  create?: (data: any) => any;
  update?: (data: any) => any;
  delete?: (id: string) => any;
  initialize?: (data: any) => any;
};

export const SLICE_REGISTRY: Record<string, SliceActions> = {
  bots: {
    create: botsSlice.create,
    update: botsSlice.update,
    delete: botsSlice.deleteBot,
    initialize: botsSlice.initialize,
  },
  settings: {
    update: settingsSlice.update,
    initialize: settingsSlice.initialize,
  },
  stickerPacks: {
    create: stickerPacksSlice.create,
    update: stickerPacksSlice.update,
    delete: stickerPacksSlice.deletePack,
    initialize: stickerPacksSlice.initialize,
  },
  manifests: {
    create: manifestsSlice.create,
    update: manifestsSlice.update,
    delete: manifestsSlice.deleteManifest,
    initialize: manifestsSlice.initialize,
  },
};
