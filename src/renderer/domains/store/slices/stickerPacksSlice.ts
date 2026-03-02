import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';

export const STICKER_PACKS_SLICE_NAME = 'stickerPacks';

interface StickerPacksState {
  packs: StickerPackManifest[];
}

const initialState: StickerPacksState = {
  packs: []
};

const stickerPacksSlice = createSlice({
  name: STICKER_PACKS_SLICE_NAME,
  initialState,
  reducers: {
    create: (state, action: PayloadAction<StickerPackManifest>) => {
      state.packs.push(action.payload);
    },
    update: (state, action: PayloadAction<StickerPackManifest>) => {
      const index = state.packs.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.packs[index] = action.payload;
      }
    },
    delete: (state, action: PayloadAction<string>) => {
      state.packs = state.packs.filter(p => p.id !== action.payload);
    },
    initialize: (state, action: PayloadAction<StickerPackManifest[]>) => {
      state.packs = action.payload;
    }
  }
});

export const { create, update, delete: deletePack, initialize } = stickerPacksSlice.actions;
export default stickerPacksSlice.reducer;
