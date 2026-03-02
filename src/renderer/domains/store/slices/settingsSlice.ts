import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Theme } from '@/shared/domains/settings/types';
import { SETTINGS_SLICE_NAME } from './constants';

interface SettingsState {
  theme: Theme;
}

const initialState: SettingsState = {
  theme: 'system'
};

const settingsSlice = createSlice({
  name: SETTINGS_SLICE_NAME,
  initialState,
  reducers: {
    update: (state, action: PayloadAction<{ theme: Theme }>) => {
      state.theme = action.payload.theme;
    },
    initialize: (state, action: PayloadAction<{ theme: Theme }>) => {
      state.theme = action.payload.theme;
    }
  }
});

export const { update, initialize } = settingsSlice.actions;
export default settingsSlice.reducer;
