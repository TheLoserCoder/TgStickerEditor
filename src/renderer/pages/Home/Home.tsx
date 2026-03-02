import React from 'react';
import { Flex, Heading } from '@radix-ui/themes';
import { PlusIcon, FileTextIcon, GearIcon } from '@radix-ui/react-icons';
import { CenteredFormLayout, IconButton } from '@/renderer/components/ui';
import { ButtonVariant, ComponentSize } from '@/renderer/components/ui/enums';
import { HeadingSize, FlexDirection, FlexGap } from '@/renderer/components/ui/radixEnums';
import { Routes } from '@/renderer/config/routes';
import { useHome } from './hooks/useHome';
import { PAGE_TITLE, MENU_LABELS } from './constants';
import styles from './Home.module.css';

const MENU_ITEMS = [
  { label: MENU_LABELS.CREATE_PACK, route: Routes.STICKER_PACKS, icon: <PlusIcon />, variant: ButtonVariant.SOLID, action: 'create' },
  { label: MENU_LABELS.MY_PACKS, route: Routes.STICKER_PACKS, icon: <FileTextIcon />, variant: ButtonVariant.OUTLINE },
  { label: MENU_LABELS.SETTINGS, route: Routes.SETTINGS, icon: <GearIcon />, variant: ButtonVariant.OUTLINE }
];

export const Home: React.FC = () => {
  const { handleNavigate } = useHome();

  return (
    <CenteredFormLayout>
      <Flex direction={FlexDirection.COLUMN} gap={FlexGap.MEDIUM} align="center">
        <Heading size={HeadingSize.XLARGE}>{PAGE_TITLE}</Heading>
        <Flex direction={FlexDirection.COLUMN} gap={FlexGap.SMALL} className={styles.menuContainer}>
          {MENU_ITEMS.map(({ label, route, icon, variant, action }) => (
            <IconButton
              key={label}
              size={ComponentSize.LARGE}
              variant={variant}
              icon={icon}
              label={label}
              onClick={() => handleNavigate(route, action)}
              className={styles.menuButton}
            />
          ))}
        </Flex>
      </Flex>
    </CenteredFormLayout>
  );
};
