import { useEffect, useState } from 'react';
import { useBotService } from './useBotService';
import { useSettingsService } from './useSettingsService';
import { store } from '@/renderer/domains/store/store';
import { BOTS_SLICE_NAME, SETTINGS_SLICE_NAME } from '@/renderer/domains/store/slices/constants';

enum SliceAction {
  BOTS_INITIALIZE = 'bots/initialize',
  SETTINGS_INITIALIZE = 'settings/initialize',
}

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasNoBots, setHasNoBots] = useState(false);
  const botService = useBotService();
  const settingsService = useSettingsService();

  useEffect(() => {
    const initialize = async () => {
      try {
        const [bots, settings] = await Promise.all([
          botService.getAll(),
          settingsService.getAll()
        ]);
        
        store.dispatch({ type: SliceAction.BOTS_INITIALIZE, payload: bots });
        store.dispatch({ type: SliceAction.SETTINGS_INITIALIZE, payload: settings });
        
        setHasNoBots(bots.length === 0);
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, [botService, settingsService]);

  return { isInitialized, hasNoBots };
};
