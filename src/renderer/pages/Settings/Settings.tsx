import React from 'react';
import { Flex, Heading, Text, Select } from '@radix-ui/themes';
import { GearIcon, PersonIcon, Pencil1Icon, MixIcon } from '@radix-ui/react-icons';
import { PageLayout, IconButton, Button, DeleteButton } from '@/renderer/components/ui';
import { ButtonVariant, ComponentSize } from '@/renderer/components/ui/enums';
import { HeadingSize, FlexDirection, FlexGap } from '@/renderer/components/ui/radixEnums';
import { useSettings } from './hooks/useSettings';
import { AddBotDialog, EditBotDialog } from './components';
import { PresetSection } from './components/PresetSection';
import { PAGE_TITLE, SECTIONS, SECTION_LABELS, GENERAL_LABELS, BOTS_LABELS } from './constants';
import styles from './Settings.module.css';

export const Settings: React.FC = () => {
  const {
    activeSection,
    setActiveSection,
    theme,
    setTheme,
    bots,
    handleBack,
    isAddBotDialogOpen,
    setIsAddBotDialogOpen,
    handleAddBot,
    isEditBotDialogOpen,
    setIsEditBotDialogOpen,
    editingBot,
    handleEditBot,
    handleDeleteBot,
    openEditDialog
  } = useSettings();

  const sidebar = (
    <div className={styles.sidebarContent}>
      <IconButton
        icon={<GearIcon />}
        label={SECTION_LABELS[SECTIONS.GENERAL]}
        variant={activeSection === SECTIONS.GENERAL ? ButtonVariant.SOFT : ButtonVariant.GHOST}
        onClick={() => setActiveSection(SECTIONS.GENERAL)}
        className={styles.sectionButton}
      />
      <IconButton
        icon={<PersonIcon />}
        label={SECTION_LABELS[SECTIONS.BOTS]}
        variant={activeSection === SECTIONS.BOTS ? ButtonVariant.SOFT : ButtonVariant.GHOST}
        onClick={() => setActiveSection(SECTIONS.BOTS)}
        className={styles.sectionButton}
      />
      <IconButton
        icon={<MixIcon />}
        label={SECTION_LABELS[SECTIONS.PRESETS]}
        variant={activeSection === SECTIONS.PRESETS ? ButtonVariant.SOFT : ButtonVariant.GHOST}
        onClick={() => setActiveSection(SECTIONS.PRESETS)}
        className={styles.sectionButton}
      />
    </div>
  );

  return (
    <PageLayout sidebar={sidebar} onBack={handleBack}>
      <div className={styles.contentContainer}>
        <Heading size={HeadingSize.XLARGE} className={styles.contentHeader}>{PAGE_TITLE}</Heading>

        {activeSection === SECTIONS.GENERAL && (
          <Flex direction={FlexDirection.COLUMN} gap={FlexGap.SMALL}>
            <div className={styles.settingRow}>
              <Text size={ComponentSize.LARGE} weight="medium">{GENERAL_LABELS.THEME}</Text>
              <Select.Root value={theme} onValueChange={setTheme}>
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="light">{GENERAL_LABELS.THEME_LIGHT}</Select.Item>
                  <Select.Item value="dark">{GENERAL_LABELS.THEME_DARK}</Select.Item>
                  <Select.Item value="system">{GENERAL_LABELS.THEME_SYSTEM}</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </Flex>
        )}

        {activeSection === SECTIONS.BOTS && (
          <Flex direction={FlexDirection.COLUMN} gap={FlexGap.SMALL}>
            <IconButton
              icon={<PersonIcon />}
              label={BOTS_LABELS.ADD_BOT}
              variant={ButtonVariant.SOFT}
              onClick={() => setIsAddBotDialogOpen(true)}
            />
            {bots.length === 0 ? (
              <div className={styles.emptyState}>
                <Text size={ComponentSize.LARGE}>{BOTS_LABELS.NO_BOTS}</Text>
              </div>
            ) : (
              bots.map(bot => (
                <div key={bot.id} className={styles.botCard}>
                  <div className={styles.botInfo}>
                    <Text weight="bold">{bot.name}</Text>
                    <Text size={ComponentSize.SMALL} color="gray">User ID: {bot.userId}</Text>
                  </div>
                  <div className={styles.botActions}>
                    <Button
                      variant={ButtonVariant.GHOST}
                      onClick={() => openEditDialog(bot)}
                    >
                      <Pencil1Icon />
                    </Button>
                    <DeleteButton onClick={() => handleDeleteBot(bot)} />
                  </div>
                </div>
              ))
            )}
          </Flex>
        )}

        {activeSection === SECTIONS.PRESETS && <PresetSection />}
      </div>

      <AddBotDialog
        open={isAddBotDialogOpen}
        onOpenChange={setIsAddBotDialogOpen}
        onSubmit={handleAddBot}
      />

      <EditBotDialog
        open={isEditBotDialogOpen}
        onOpenChange={setIsEditBotDialogOpen}
        onSubmit={handleEditBot}
        bot={editingBot}
      />
    </PageLayout>
  );
};
