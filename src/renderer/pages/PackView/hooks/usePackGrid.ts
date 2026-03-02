import { useState, useEffect, useCallback } from 'react';
import { GridLayout } from '@/shared/domains/grid/types';
import { useStickerPackFacade } from '@/renderer/hooks/useStickerPackFacade';
import { useConfirm } from '@/renderer/utils/confirmation';
import { GRID_CONTEXT_CONFIRMATIONS } from '../components/GridView/gridContextConstants';

export const usePackGrid = (packId: string) => {
  const [grid, setGrid] = useState<GridLayout | null>(null);
  const [fragmentPaths, setFragmentPaths] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const facade = useStickerPackFacade();
  const confirm = useConfirm();

  useEffect(() => {
    const loadGrid = async () => {
      setLoading(true);
      try {
        const gridLayout = await facade.getGrid(packId);
        if (gridLayout) {
          setGrid(gridLayout);
          
          const paths = new Map<string, string>();
          for (const cell of gridLayout.cells) {
            if (cell.fragmentId) {
              const path = await facade.getFragmentPath(packId, cell.fragmentId);
              if (path) {
                const pack = await facade.getPack(packId);
                if (pack) {
                  const packFolderName = `${pack.name}_${pack.id}`;
                  const fileName = path.split('/').pop() || path.split('\\').pop();
                  paths.set(cell.fragmentId, `sticker-packs://${packFolderName}/fragments/${fileName}`);
                }
              }
            }
          }
          setFragmentPaths(paths);
        }
      } catch (error) {
        console.error('Failed to load grid:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGrid();
  }, [packId, facade]);

  const handleMoveGroup = useCallback(async (groupId: string, targetRow: number, targetCol: number, clearSelection?: () => void) => {
    try {
      const newGrid = await facade.moveGroupInGrid(packId, groupId, targetRow, targetCol);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to move group:', error);
    }
  }, [packId, facade]);

  const handleMoveSingleFragment = useCallback(async (fragmentId: string, targetRow: number, targetCol: number, clearSelection?: () => void) => {
    try {
      const newGrid = await facade.moveSingleFragmentInGrid(packId, fragmentId, targetRow, targetCol);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to move single fragment:', error);
    }
  }, [packId, facade]);

  const handleSwapFragments = useCallback(async (fragmentId1: string, fragmentId2: string, clearSelection?: () => void) => {
    if (!grid) return;

    const cell1 = grid.cells.find(c => c.fragmentId === fragmentId1);
    const cell2 = grid.cells.find(c => c.fragmentId === fragmentId2);

    if (!cell1 || !cell2) return;

    try {
      const newGrid = await facade.moveFragmentInGrid(packId, fragmentId1, cell2.row, cell2.col);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to swap fragments:', error);
    }
  }, [packId, grid, facade]);

  const handleCreateGroup = useCallback(async (cellIds: string[], clearSelection?: () => void) => {
    try {
      const newGrid = await facade.createGroupFromFragments(packId, cellIds);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to create group:', error);
    }
  }, [packId, facade]);

  const handleRemoveFromGroup = useCallback(async (cellIds: string[], clearSelection?: () => void) => {
    try {
      const newGrid = await facade.removeFragmentsFromGroup(packId, cellIds);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to remove from group:', error);
    }
  }, [packId, facade]);

  const handleDeleteFragments = useCallback(async (fragmentIds: string[], clearSelection?: () => void) => {
    const confirmed = await confirm({
      ...GRID_CONTEXT_CONFIRMATIONS.DELETE_FRAGMENTS,
      message: GRID_CONTEXT_CONFIRMATIONS.DELETE_FRAGMENTS.message(fragmentIds.length)
    });

    if (confirmed) {
      try {
        const newGrid = await facade.deleteFragments(packId, fragmentIds);
        setGrid(newGrid);
        clearSelection?.();
      } catch (error) {
        console.error('Failed to delete fragments:', error);
      }
    }
  }, [packId, facade, confirm]);

  const handleDeleteGroup = useCallback(async (groupId: string, clearSelection?: () => void) => {
    try {
      const newGrid = await facade.deleteGroupKeepFragments(packId, groupId);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  }, [packId, facade]);

  const handleDeleteGroupWithFragments = useCallback(async (groupId: string, clearSelection?: () => void) => {
    const confirmed = await confirm(GRID_CONTEXT_CONFIRMATIONS.DELETE_GROUP_WITH_FRAGMENTS);

    if (confirmed) {
      try {
        const newGrid = await facade.deleteGroupWithFragments(packId, groupId);
        setGrid(newGrid);
        clearSelection?.();
      } catch (error) {
        console.error('Failed to delete group with fragments:', error);
      }
    }
  }, [packId, facade, confirm]);

  const handleDeleteGroupKeepFragments = useCallback(async (groupId: string, clearSelection?: () => void) => {
    try {
      const newGrid = await facade.deleteGroupKeepFragments(packId, groupId);
      setGrid(newGrid);
      clearSelection?.();
    } catch (error) {
      console.error('Failed to delete group keep fragments:', error);
    }
  }, [packId, facade]);

  const handleNormalizeGrid = useCallback(async () => {
    try {
      const newGrid = await facade.normalizeGrid(packId);
      setGrid(newGrid);
    } catch (error) {
      console.error('Failed to normalize grid:', error);
    }
  }, [packId, facade]);

  return {
    grid,
    fragmentPaths,
    loading,
    handleMoveGroup,
    handleMoveSingleFragment,
    handleSwapFragments,
    handleCreateGroup,
    handleRemoveFromGroup,
    handleDeleteFragments,
    handleDeleteGroup,
    handleDeleteGroupWithFragments,
    handleDeleteGroupKeepFragments,
    handleNormalizeGrid
  };
};
