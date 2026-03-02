import React, { useState, useEffect } from 'react';
import { HashRouter, Routes as RouterRoutes, Route } from 'react-router-dom';
import { Theme } from '@radix-ui/themes';
import { Provider } from 'react-redux';
import { store } from '@/renderer/domains/store/store';
import { ConfirmationProvider } from '@/renderer/utils/confirmation';
import { useThemeEffect } from '@/renderer/hooks/useThemeEffect';
import { useAppInitialization } from '@/renderer/hooks/useAppInitialization';
import { useBotService } from '@/renderer/hooks/useBotService';
import { Routes } from '@/renderer/config/routes';
import { Home } from '@/renderer/pages/Home';
import { Settings } from '@/renderer/pages/Settings';
import { StickerPacks } from '@/renderer/pages/StickerPacks';
import { PackView } from '@/renderer/pages/PackView';
import { EditPack } from '@/renderer/pages/EditPack';
import { AddBotDialog } from '@/renderer/pages/Settings/components';
import '@radix-ui/themes/styles.css';
import '@/renderer/styles/theme.css';

const AppContent: React.FC = () => {
  const resolvedTheme = useThemeEffect();
  const { isInitialized, hasNoBots } = useAppInitialization();
  const [isAddBotDialogOpen, setIsAddBotDialogOpen] = useState(false);
  const botService = useBotService();

  useEffect(() => {
    if (isInitialized && hasNoBots) {
      setIsAddBotDialogOpen(true);
    }
  }, [isInitialized, hasNoBots]);

  const handleAddBot = async (name: string, token: string, userId: string) => {
    try {
      await botService.create(name, token, userId);
      setIsAddBotDialogOpen(false);
    } catch (error) {
      console.error('Failed to add bot:', error);
    }
  };

  return (
    <Theme appearance={resolvedTheme}>
      <ConfirmationProvider>
        <HashRouter>
          <RouterRoutes>
            <Route path={Routes.HOME} element={<Home />} />
            <Route path={Routes.SETTINGS} element={<Settings />} />
            <Route path={Routes.STICKER_PACKS} element={<StickerPacks />} />
            <Route path={Routes.PACK_VIEW} element={<PackView />} />
            <Route path={Routes.EDIT_PACK} element={<EditPack />} />
          </RouterRoutes>
        </HashRouter>

        <AddBotDialog
          open={isAddBotDialogOpen}
          onOpenChange={setIsAddBotDialogOpen}
          onSubmit={handleAddBot}
          canClose={!hasNoBots}
        />
      </ConfirmationProvider>
    </Theme>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};
