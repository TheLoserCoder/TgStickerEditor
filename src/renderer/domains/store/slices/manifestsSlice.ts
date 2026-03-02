import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StickerPackManifest } from '@/shared/domains/sticker-pack/types';

export const MANIFESTS_SLICE_NAME = 'manifests';

interface ManifestsState {
  manifests: StickerPackManifest[];
}

const initialState: ManifestsState = {
  manifests: []
};

const manifestsSlice = createSlice({
  name: MANIFESTS_SLICE_NAME,
  initialState,
  reducers: {
    create: (state, action: PayloadAction<StickerPackManifest>) => {
      state.manifests.push(action.payload);
    },
    update: (state, action: PayloadAction<StickerPackManifest>) => {
      const index = state.manifests.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.manifests[index] = action.payload;
      }
    },
    delete: (state, action: PayloadAction<string>) => {
      state.manifests = state.manifests.filter(m => m.id !== action.payload);
    },
    initialize: (state, action: PayloadAction<StickerPackManifest[]>) => {
      state.manifests = action.payload;
    }
  }
});

export const { create, update, delete: deleteManifest, initialize } = manifestsSlice.actions;
export default manifestsSlice.reducer;
