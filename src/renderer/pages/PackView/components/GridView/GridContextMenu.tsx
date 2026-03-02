import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { LayersIcon, TrashIcon, CheckIcon, Cross2Icon, CursorArrowIcon, MinusIcon } from '@radix-ui/react-icons';
import { GridContextAction, GRID_CONTEXT_LABELS } from './gridContextConstants';
import styles from './GridContextMenu.module.css';

interface GridContextMenuProps {
  children: React.ReactNode;
  selectedCount: number;
  allInSameGroup: boolean;
  hasGroup: boolean;
  hasMultipleGroups: boolean;
  totalFragments: number;
  onAction: (action: GridContextAction) => void;
}

const MenuItem: React.FC<{
  onSelect: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ onSelect, icon, children }) => (
  <ContextMenu.Item onSelect={onSelect} className={styles.item}>
    {icon && <span className={styles.icon}>{icon}</span>}
    {children}
  </ContextMenu.Item>
);

const SubTrigger: React.FC<{
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ icon, children }) => (
  <ContextMenu.SubTrigger className={styles.item}>
    {icon && <span className={styles.icon}>{icon}</span>}
    {children}
  </ContextMenu.SubTrigger>
);

export const GridContextMenu: React.FC<GridContextMenuProps> = ({
  children,
  selectedCount,
  allInSameGroup,
  hasGroup,
  hasMultipleGroups,
  totalFragments,
  onAction
}) => {
  const canCreateGroup = selectedCount > 1;
  const canRemoveFromGroup = (allInSameGroup && hasGroup) || hasMultipleGroups;
  const canDeleteGroup = (allInSameGroup && hasGroup) || hasMultipleGroups;
  const canSelectAll = selectedCount < totalFragments;
  const canDeselect = selectedCount > 0;
  const canSelectGroup = hasGroup && allInSameGroup;
  const canDelete = selectedCount > 0;

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
      </ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content className={styles.content}>
          <ContextMenu.Sub>
            <SubTrigger icon={<CursorArrowIcon />}>{GRID_CONTEXT_LABELS.SELECT}</SubTrigger>
            <ContextMenu.Portal>
              <ContextMenu.SubContent className={styles.content}>
                {canSelectAll && (
                  <MenuItem onSelect={() => onAction(GridContextAction.SELECT_ALL)} icon={<CheckIcon />}>
                    {GRID_CONTEXT_LABELS.SELECT_ALL}
                  </MenuItem>
                )}
                {canDeselect && (
                  <MenuItem onSelect={() => onAction(GridContextAction.DESELECT_ALL)} icon={<Cross2Icon />}>
                    {GRID_CONTEXT_LABELS.DESELECT_ALL}
                  </MenuItem>
                )}
                {canSelectGroup && (
                  <MenuItem onSelect={() => onAction(GridContextAction.SELECT_GROUP)} icon={<LayersIcon />}>
                    {GRID_CONTEXT_LABELS.SELECT_GROUP}
                  </MenuItem>
                )}
              </ContextMenu.SubContent>
            </ContextMenu.Portal>
          </ContextMenu.Sub>

          {canCreateGroup && (
            <>
              <MenuItem
                onSelect={() => onAction(GridContextAction.CREATE_GROUP)}
                icon={<LayersIcon />}
              >
                {GRID_CONTEXT_LABELS.CREATE_GROUP}
              </MenuItem>
              <ContextMenu.Separator className={styles.separator} />
            </>
          )}

          {canDelete && (
            <>
              <ContextMenu.Sub>
                <SubTrigger icon={<TrashIcon />}>
                  {GRID_CONTEXT_LABELS.DELETE}
                </SubTrigger>
                <ContextMenu.Portal>
                  <ContextMenu.SubContent className={styles.content}>
                    <MenuItem onSelect={() => onAction(GridContextAction.DELETE_FRAGMENTS)} icon={<TrashIcon />}>
                      {GRID_CONTEXT_LABELS.DELETE_FRAGMENTS}
                    </MenuItem>

                    {canRemoveFromGroup && (
                      <MenuItem onSelect={() => onAction(GridContextAction.REMOVE_FROM_GROUP)} icon={<MinusIcon />}>
                        {GRID_CONTEXT_LABELS.REMOVE_FROM_GROUP}
                      </MenuItem>
                    )}

                    {canDeleteGroup && (
                      <>
                        <ContextMenu.Separator className={styles.separator} />
                        <MenuItem onSelect={() => onAction(GridContextAction.DELETE_GROUP)} icon={<LayersIcon />}>
                          {GRID_CONTEXT_LABELS.DELETE_GROUP}
                        </MenuItem>
                        <MenuItem onSelect={() => onAction(GridContextAction.DELETE_GROUP_WITH_FRAGMENTS)} icon={<TrashIcon />}>
                          {GRID_CONTEXT_LABELS.DELETE_GROUP_WITH_FRAGMENTS}
                        </MenuItem>
                        <MenuItem onSelect={() => onAction(GridContextAction.DELETE_GROUP_KEEP_FRAGMENTS)} icon={<MinusIcon />}>
                          {GRID_CONTEXT_LABELS.DELETE_GROUP_KEEP_FRAGMENTS}
                        </MenuItem>
                      </>
                    )}
                  </ContextMenu.SubContent>
                </ContextMenu.Portal>
              </ContextMenu.Sub>
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
