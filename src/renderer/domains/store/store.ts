import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from './slices/settingsSlice';
import botsReducer from './slices/botsSlice';
import stickerPacksReducer from './slices/stickerPacksSlice';
import manifestsReducer from './slices/manifestsSlice';

export const store = configureStore({
  reducer: {
    settings: settingsReducer,
    bots: botsReducer,
    stickerPacks: stickerPacksReducer,
    manifests: manifestsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
