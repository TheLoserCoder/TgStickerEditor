import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Bot } from '@/shared/domains/bot/types';
import { BOTS_SLICE_NAME } from './constants';

interface BotsState {
  bots: Bot[];
}

const initialState: BotsState = {
  bots: []
};

const botsSlice = createSlice({
  name: BOTS_SLICE_NAME,
  initialState,
  reducers: {
    create: (state, action: PayloadAction<Bot>) => {
      state.bots.push(action.payload);
    },
    update: (state, action: PayloadAction<Bot>) => {
      const index = state.bots.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.bots[index] = action.payload;
      }
    },
    delete: (state, action: PayloadAction<string>) => {
      state.bots = state.bots.filter(b => b.id !== action.payload);
    },
    initialize: (state, action: PayloadAction<Bot[]>) => {
      state.bots = action.payload;
    }
  }
});

export const { create, update, delete: deleteBot, initialize } = botsSlice.actions;
export default botsSlice.reducer;
