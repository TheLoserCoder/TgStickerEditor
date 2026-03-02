import { GridLayout } from '../../../../shared/domains/grid/types';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';

export interface FragmentInput {
  id: string;
  groupId?: string;
  row?: number;
  col?: number;
}

export interface ISmartGridCalculator {
  calculateInitialLayout(
    fragments: FragmentInput[],
    packType: StickerPackType
  ): GridLayout;

  addFragments(
    currentLayout: GridLayout,
    newFragments: FragmentInput[]
  ): GridLayout;

  moveGroup(
    layout: GridLayout,
    groupId: string,
    targetRow: number,
    targetCol: number
  ): GridLayout;

  moveSingleFragment(
    layout: GridLayout,
    fragmentId: string,
    targetRow: number,
    targetCol: number
  ): GridLayout;

  moveFragment(
    layout: GridLayout,
    fragmentId: string,
    targetRow: number,
    targetCol: number
  ): GridLayout;

  clearCell(
    layout: GridLayout,
    fragmentId: string
  ): GridLayout;

  removeGroup(
    layout: GridLayout,
    groupId: string
  ): GridLayout;

  createGroupFromFragments(
    layout: GridLayout,
    cellIds: string[],
    newGroupId: string
  ): GridLayout;

  removeFragmentsFromGroup(
    layout: GridLayout,
    cellIds: string[]
  ): GridLayout;

  deleteFragments(
    layout: GridLayout,
    fragmentIds: string[]
  ): GridLayout;
}
