import { useEffect, useState } from 'react';
import { Theme } from '@/shared/domains/settings/types';
import { useStateValue } from '@/renderer/domains/store/hooks';
import { SETTINGS_SLICE_NAME } from '@/renderer/domains/store/slices/constants';

const resolveSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeEffect = () => {
  const theme = useStateValue<Theme>(`${SETTINGS_SLICE_NAME}.theme`) || 'system';
  
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => 
    theme === 'system' ? resolveSystemTheme() : theme
  );

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? 'dark' : 'light');
      };

      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', handler);

      return () => mediaQuery.removeEventListener('change', handler);
    } else {
      setResolvedTheme(theme);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  return resolvedTheme;
};
