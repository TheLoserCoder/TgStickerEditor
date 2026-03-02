import React from 'react';
import { Heading, Text } from '@radix-ui/themes';
import { PlusIcon } from '@radix-ui/react-icons';
import { PageLayout, IconButton } from '@/renderer/components/ui';
import { ButtonVariant } from '@/renderer/components/ui/enums';
import { HeadingSize } from '@/renderer/components/ui/radixEnums';
import { CreateStickerPackDialog, StickerPackCard } from './components';
import { useStickerPacks } from './hooks/useStickerPacks';
import { PAGE_TITLE, CREATE_PACK_BUTTON, EMPTY_STATE_TEXT } from './constants';
import styles from './StickerPacks.module.css';

export const StickerPacks: React.FC = () => {
  const {
    packs,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    handleBack,
    handleCreatePack,
    handlePackClick,
    handleDeletePack,
    handleOpenFolder,
  } = useStickerPacks();

  return (
    <PageLayout onBack={handleBack}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Heading size={HeadingSize.XLARGE}>{PAGE_TITLE}</Heading>
          <IconButton
            icon={<PlusIcon />}
            label={CREATE_PACK_BUTTON}
            variant={ButtonVariant.SOLID}
            onClick={() => setIsCreateDialogOpen(true)}
          />
        </div>

        {packs.length === 0 ? (
          <div className={styles.emptyState}>
            <Text>{EMPTY_STATE_TEXT}</Text>
          </div>
        ) : (
          <div className={styles.grid}>
            {packs.map((pack) => (
              <StickerPackCard
                key={pack.id}
                id={pack.id}
                name={pack.name}
                type={pack.type}
                fragmentsCount={pack.fragmentsCount}
                fragments={pack.fragments}
                onClick={() => handlePackClick(pack.id)}
                onDelete={() => handleDeletePack(pack.id, pack.name)}
                onOpenFolder={() => handleOpenFolder(pack.id)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateStickerPackDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreatePack}
      />
    </PageLayout>
  );
};
