import { useCallback } from 'react';
import { Theme } from '@/shared/domains/settings/types';
import { useStateValue } from '@/renderer/domains/store/hooks';
import { useSettingsService } from './useSettingsService';
import { SETTINGS_SLICE_NAME } from '@/renderer/domains/store/slices/constants';

export const useTheme = () => {
  const settingsService = useSettingsService();
  const theme = useStateValue<Theme>(`${SETTINGS_SLICE_NAME}.theme`) || 'system';

  const setTheme = useCallback(async (newTheme: Theme) => {
    await settingsService.set('theme', newTheme);
  }, [settingsService]);

  return { theme, setTheme };
};
