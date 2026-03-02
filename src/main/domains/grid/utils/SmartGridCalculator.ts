import { GridLayout, GridCell, FragmentGroup } from '../../../../shared/domains/grid/types';
import { isEmptyCell } from '../../../../shared/domains/grid/utils';
import { StickerPackType } from '../../../../shared/domains/sticker-pack/enums';
import { ISmartGridCalculator, FragmentInput } from './ISmartGridCalculator';
import { IIdGenerator } from '../../../../shared/utils/id-generator/interfaces/IIdGenerator';
import { GRID_COLUMNS } from '../constants';

interface GroupBounds {
  groupId: string;
  width: number;
  height: number;
  fragments: Array<{ id: string; offsetRow: number; offsetCol: number }>;
}

interface PlacedGroup extends GroupBounds {
  startRow: number;
  startCol: number;
}

const CELL_KEY = (row: number, col: number) => `${row}_${col}`;

export class SmartGridCalculator implements ISmartGridCalculator {
  constructor(private idGenerator: IIdGenerator) {}

  calculateInitialLayout(fragments: FragmentInput[], packType: StickerPackType): GridLayout {
    const columns = packType === StickerPackType.EMOJI ? GRID_COLUMNS.EMOJI : GRID_COLUMNS.STICKER;
    
    const hasCoordinates = fragments.length > 0 && fragments.every(f => f.row !== undefined && f.col !== undefined);
    
    if (hasCoordinates) {
      const groupMap = this.groupFragmentsWithPositions(fragments as Array<FragmentInput & { row: number; col: number }>);
      const groupBounds = this.createGroupBoundsWithPositions(groupMap, columns);
      const placedGroups = this.placeGroups(groupBounds, columns);
      const { cells, totalRows } = this.createCells(placedGroups, columns);
      const groups = this.createFragmentGroups(groupMap);
      return { columns, rows: totalRows, cells, groups };
    } else {
      const groupMap = this.groupFragments(fragments);
      const groupBounds = this.createGroupBounds(groupMap);
      const placedGroups = this.placeGroups(groupBounds, columns);
      const { cells, totalRows } = this.createCells(placedGroups, columns);
      const groups = this.createFragmentGroupsSimple(groupMap);
      return { columns, rows: totalRows, cells, groups };
    }
  }

  addFragments(currentLayout: GridLayout, newFragments: FragmentInput[]): GridLayout {
    const existingFragmentIds = new Set(
      currentLayout.cells.filter(c => c.fragmentId).map(c => c.fragmentId!)
    );
    
    const uniqueNewFragments = newFragments.filter(f => !existingFragmentIds.has(f.id));
    
    if (uniqueNewFragments.length === 0) {
      return currentLayout;
    }

    const hasCoordinates = uniqueNewFragments.every(f => f.row !== undefined && f.col !== undefined);

    if (hasCoordinates) {
      const newFragmentsWithCoords = uniqueNewFragments as Array<FragmentInput & { row: number; col: number }>;
      const newGroupMap = this.groupFragmentsWithPositions(newFragmentsWithCoords);
      const newGroupBounds = this.createGroupBoundsWithPositions(newGroupMap, currentLayout.columns);

      const existingCells = currentLayout.cells.filter(c => c.fragmentId);
      const existingGroupBounds = this.createExistingGroupBounds(existingCells);

      const allGroupBounds = [...existingGroupBounds, ...newGroupBounds];
      const placedGroups = this.placeGroupsTight(allGroupBounds, currentLayout.columns);
      const { cells, totalRows } = this.createCells(placedGroups, currentLayout.columns);

      const allFragments = [
        ...existingCells.map(c => ({ id: c.fragmentId!, groupId: c.groupId })),
        ...uniqueNewFragments.map(f => ({ id: f.id, groupId: f.groupId || 'default' }))
      ];
      const groupMap = this.groupFragments(allFragments);
      const groups = this.createFragmentGroupsSimple(groupMap);

      return { columns: currentLayout.columns, rows: totalRows, cells, groups };
    } else {
      const allFragments: FragmentInput[] = [
        ...currentLayout.cells
          .filter(c => c.fragmentId)
          .map(c => ({
            id: c.fragmentId!,
            groupId: c.groupId
          })),
        ...uniqueNewFragments
      ];

      const groupMap = this.groupFragments(allFragments);
      const groupBounds = this.createGroupBounds(groupMap);
      const placedGroups = this.placeGroups(groupBounds, currentLayout.columns);
      const { cells, totalRows } = this.createCells(placedGroups, currentLayout.columns);
      const groups = this.createFragmentGroupsSimple(groupMap);

      return { columns: currentLayout.columns, rows: totalRows, cells, groups };
    }
  }

  moveSingleFragment(layout: GridLayout, fragmentId: string, targetRow: number, targetCol: number): GridLayout {
    const sourceCell = layout.cells.find(c => c.fragmentId === fragmentId);
    if (!sourceCell || isEmptyCell(sourceCell)) {
      return layout;
    }

    const occupied = new Set<string>();
    const movedCell: GridCell = { ...sourceCell, row: targetRow, col: targetCol };
    occupied.add(CELL_KEY(targetRow, targetCol));

    const otherCells = layout.cells.filter(c => !isEmptyCell(c) && c.fragmentId !== fragmentId);
    const groupedOthers = new Map<string, GridCell[]>();
    
    for (const cell of otherCells) {
      if (!groupedOthers.has(cell.groupId)) {
        groupedOthers.set(cell.groupId, []);
      }
      groupedOthers.get(cell.groupId)!.push(cell);
    }

    const resultCells: GridCell[] = [movedCell];

    for (const [otherGroupId, cells] of groupedOthers) {
      const hasCollision = cells.some(c => occupied.has(CELL_KEY(c.row, c.col)));
      
      if (!hasCollision) {
        for (const cell of cells) {
          occupied.add(CELL_KEY(cell.row, cell.col));
          resultCells.push(cell);
        }
      } else {
        const groupMinRow = Math.min(...cells.map(c => c.row));
        const groupMinCol = Math.min(...cells.map(c => c.col));
        const groupMaxRow = Math.max(...cells.map(c => c.row));
        const groupMaxCol = Math.max(...cells.map(c => c.col));
        const groupWidth = groupMaxCol - groupMinCol + 1;

        let placed = false;
        let radius = 0;
        
        while (!placed && radius < 100) {
          const candidates: Array<{row: number; col: number; distance: number; verticalDown: number}> = [];
          
          for (let dr = -radius; dr <= radius && !placed; dr++) {
            for (let dc = -radius; dc <= radius && !placed; dc++) {
              if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
              
              const testRow = groupMinRow + dr;
              const testCol = groupMinCol + dc;
              
              if (testRow < 0 || testCol < 0 || testCol + groupWidth > layout.columns) continue;
              
              let canPlace = true;
              for (const cell of cells) {
                const offsetRow = cell.row - groupMinRow;
                const offsetCol = cell.col - groupMinCol;
                const checkRow = testRow + offsetRow;
                const checkCol = testCol + offsetCol;
                
                if (occupied.has(CELL_KEY(checkRow, checkCol))) {
                  canPlace = false;
                  break;
                }
              }
              
              if (canPlace) {
                const verticalDown = dr > 0 ? dr : 0;
                candidates.push({
                  row: testRow,
                  col: testCol,
                  distance: Math.abs(dr) + Math.abs(dc),
                  verticalDown
                });
              }
            }
          }
          
          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              if (a.verticalDown !== b.verticalDown) return a.verticalDown - b.verticalDown;
              return a.distance - b.distance;
            });
            const best = candidates[0];
            
            for (const cell of cells) {
              const offsetRow = cell.row - groupMinRow;
              const offsetCol = cell.col - groupMinCol;
              const newRow = best.row + offsetRow;
              const newCol = best.col + offsetCol;
              occupied.add(CELL_KEY(newRow, newCol));
              resultCells.push({ ...cell, row: newRow, col: newCol });
            }
            placed = true;
          }
          
          radius++;
        }
      }
    }

    const maxRow = Math.max(...resultCells.filter(c => !isEmptyCell(c)).map(c => c.row));
    const cellMap = new Map<string, GridCell>();
    
    for (const cell of resultCells) {
      cellMap.set(CELL_KEY(cell.row, cell.col), cell);
    }

    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const key = CELL_KEY(row, col);
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            id: this.idGenerator.generate(),
            fragmentId: null,
            groupId: 'default',
            row,
            col
          });
        }
      }
    }

    const sortedCells = Array.from(cellMap.values())
      .filter(c => c.row <= maxRow)
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

    return { columns: layout.columns, rows: maxRow + 1, cells: sortedCells, groups: layout.groups };
  }

  moveGroup(layout: GridLayout, groupId: string, targetRow: number, targetCol: number): GridLayout {
    const groupCells = layout.cells.filter(c => c.groupId === groupId && !isEmptyCell(c));
    
    if (groupCells.length === 0) {
      return layout;
    }

    const minRow = Math.min(...groupCells.map(c => c.row));
    const minCol = Math.min(...groupCells.map(c => c.col));
    const deltaRow = targetRow - minRow;
    const deltaCol = targetCol - minCol;

    // Занимаем новые позиции перемещаемой группы
    const occupied = new Set<string>();
    const movedCells: GridCell[] = [];
    
    for (const cell of groupCells) {
      const newRow = cell.row + deltaRow;
      const newCol = cell.col + deltaCol;
      occupied.add(CELL_KEY(newRow, newCol));
      movedCells.push({ ...cell, row: newRow, col: newCol });
    }

    // Обрабатываем остальные группы
    const otherCells = layout.cells.filter(c => !isEmptyCell(c) && c.groupId !== groupId);
    const groupedOthers = new Map<string, GridCell[]>();
    
    for (const cell of otherCells) {
      if (!groupedOthers.has(cell.groupId)) {
        groupedOthers.set(cell.groupId, []);
      }
      groupedOthers.get(cell.groupId)!.push(cell);
    }

    const resultCells: GridCell[] = [...movedCells];

    // Для каждой группы проверяем коллизию
    for (const [otherGroupId, cells] of groupedOthers) {
      const hasCollision = cells.some(c => occupied.has(CELL_KEY(c.row, c.col)));
      
      if (!hasCollision) {
        // Нет коллизии - оставляем на месте
        for (const cell of cells) {
          occupied.add(CELL_KEY(cell.row, cell.col));
          resultCells.push(cell);
        }
      } else {
        // Есть коллизия - ищем ближайшее свободное место
        const groupMinRow = Math.min(...cells.map(c => c.row));
        const groupMinCol = Math.min(...cells.map(c => c.col));
        const groupMaxRow = Math.max(...cells.map(c => c.row));
        const groupMaxCol = Math.max(...cells.map(c => c.col));
        const groupHeight = groupMaxRow - groupMinRow + 1;
        const groupWidth = groupMaxCol - groupMinCol + 1;

        // Ищем ближайшее место расширяя радиус
        let placed = false;
        let radius = 0;
        
        while (!placed && radius < 100) {
          // Проверяем позиции на текущем радиусе
          const candidates: Array<{row: number; col: number; distance: number; verticalDown: number}> = [];
          
          for (let dr = -radius; dr <= radius && !placed; dr++) {
            for (let dc = -radius; dc <= radius && !placed; dc++) {
              // Только на границе радиуса
              if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
              
              const testRow = groupMinRow + dr;
              const testCol = groupMinCol + dc;
              
              // Проверяем границы
              if (testRow < 0 || testCol < 0 || testCol + groupWidth > layout.columns) continue;
              
              // Проверяем можем ли разместить группу
              let canPlace = true;
              for (const cell of cells) {
                const offsetRow = cell.row - groupMinRow;
                const offsetCol = cell.col - groupMinCol;
                const checkRow = testRow + offsetRow;
                const checkCol = testCol + offsetCol;
                
                if (occupied.has(CELL_KEY(checkRow, checkCol))) {
                  canPlace = false;
                  break;
                }
              }
              
              if (canPlace) {
                const verticalDown = dr > 0 ? dr : 0;
                candidates.push({
                  row: testRow,
                  col: testCol,
                  distance: Math.abs(dr) + Math.abs(dc),
                  verticalDown
                });
              }
            }
          }
          
          // Выбираем позицию: приоритет горизонтальным смещениям, затем минимальное смещение вниз
          if (candidates.length > 0) {
            candidates.sort((a, b) => {
              // Приоритет: без смещения вниз
              if (a.verticalDown !== b.verticalDown) return a.verticalDown - b.verticalDown;
              // Затем минимальное расстояние
              if (a.distance !== b.distance) return a.distance - b.distance;
              // При равном расстоянии - приоритет левым позициям
              return a.col - b.col;
            });
            const best = candidates[0];
            
            for (const cell of cells) {
              const offsetRow = cell.row - groupMinRow;
              const offsetCol = cell.col - groupMinCol;
              const newRow = best.row + offsetRow;
              const newCol = best.col + offsetCol;
              occupied.add(CELL_KEY(newRow, newCol));
              resultCells.push({ ...cell, row: newRow, col: newCol });
            }
            placed = true;
          }
          
          radius++;
        }
      }
    }

    // Создаем финальную сетку
    const maxRow = Math.max(...resultCells.filter(c => !isEmptyCell(c)).map(c => c.row));
    const cellMap = new Map<string, GridCell>();
    
    for (const cell of resultCells) {
      cellMap.set(CELL_KEY(cell.row, cell.col), cell);
    }

    // Заполняем пустые ячейки
    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const key = CELL_KEY(row, col);
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            id: this.idGenerator.generate(),
            fragmentId: null,
            groupId: 'default',
            row,
            col
          });
        }
      }
    }

    const sortedCells = Array.from(cellMap.values())
      .filter(c => c.row <= maxRow)
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

    return { columns: layout.columns, rows: maxRow + 1, cells: sortedCells, groups: layout.groups };
  }

  moveFragment(layout: GridLayout, fragmentId: string, targetRow: number, targetCol: number): GridLayout {
    const sourceCell = layout.cells.find(c => c.fragmentId === fragmentId);
    if (!sourceCell) {
      return layout;
    }

    const targetCell = layout.cells.find(c => c.row === targetRow && c.col === targetCol);
    if (!targetCell) {
      return layout;
    }

    const newCells = layout.cells.map(cell => {
      if (cell.id === sourceCell.id) {
        return { ...cell, fragmentId: targetCell.fragmentId };
      }
      if (cell.id === targetCell.id) {
        return { ...cell, fragmentId: sourceCell.fragmentId, groupId: sourceCell.groupId };
      }
      return cell;
    });

    const groups = this.updateGroupsFromCells(newCells);

    return { ...layout, cells: newCells, groups };
  }

  clearCell(layout: GridLayout, fragmentId: string): GridLayout {
    const newCells = layout.cells.map(cell => 
      cell.fragmentId === fragmentId ? { ...cell, fragmentId: null } : cell
    );

    const groups = this.updateGroupsFromCells(newCells);

    return { ...layout, cells: newCells, groups };
  }

  removeGroup(layout: GridLayout, groupId: string): GridLayout {
    const remainingCells = layout.cells.filter(c => c.groupId !== groupId && !isEmptyCell(c));

    if (remainingCells.length === 0) {
      return { columns: layout.columns, rows: 0, cells: [], groups: [] };
    }

    const maxRow = Math.max(...remainingCells.map(c => c.row));
    const cellMap = new Map<string, GridCell>();
    
    for (const cell of remainingCells) {
      cellMap.set(CELL_KEY(cell.row, cell.col), cell);
    }

    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col < layout.columns; col++) {
        const key = CELL_KEY(row, col);
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            id: this.idGenerator.generate(),
            fragmentId: null,
            groupId: 'default',
            row,
            col
          });
        }
      }
    }

    const sortedCells = Array.from(cellMap.values())
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

    const groups = this.updateGroupsFromCells(sortedCells);

    return { columns: layout.columns, rows: maxRow + 1, cells: sortedCells, groups };
  }

  private groupFragments(fragments: FragmentInput[]): Map<string, string[]> {
    const groupMap = new Map<string, string[]>();
    
    for (const fragment of fragments) {
      const groupId = fragment.groupId || 'default';
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push(fragment.id);
    }
    
    return groupMap;
  }

  private groupFragmentsWithPositions(
    fragments: Array<FragmentInput & { row: number; col: number }>
  ): Map<string, Array<{ id: string; row: number; col: number }>> {
    const groupMap = new Map<string, Array<{ id: string; row: number; col: number }>>();
    
    for (const fragment of fragments) {
      const groupId = fragment.groupId || 'default';
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      groupMap.get(groupId)!.push({ id: fragment.id, row: fragment.row, col: fragment.col });
    }
    
    return groupMap;
  }

  private createGroupBounds(groupMap: Map<string, string[]>): GroupBounds[] {
    const bounds: GroupBounds[] = [];
    
    for (const [groupId, fragmentIds] of groupMap.entries()) {
      const size = Math.ceil(Math.sqrt(fragmentIds.length));
      const fragments = fragmentIds.map((id, index) => ({
        id,
        offsetRow: Math.floor(index / size),
        offsetCol: index % size
      }));
      
      bounds.push({
        groupId,
        width: size,
        height: Math.ceil(fragmentIds.length / size),
        fragments
      });
    }
    
    return bounds;
  }

  private createGroupBoundsWithPositions(
    groupMap: Map<string, Array<{ id: string; row: number; col: number }>>,
    maxColumns: number
  ): GroupBounds[] {
    const bounds: GroupBounds[] = [];
    
    for (const [groupId, fragments] of groupMap.entries()) {
      const minRow = Math.min(...fragments.map(f => f.row));
      const maxRow = Math.max(...fragments.map(f => f.row));
      const minCol = Math.min(...fragments.map(f => f.col));
      const maxCol = Math.max(...fragments.map(f => f.col));
      
      const width = maxCol - minCol + 1;
      
      if (width > maxColumns) {
        const size = Math.ceil(Math.sqrt(fragments.length));
        bounds.push({
          groupId,
          width: Math.min(size, maxColumns),
          height: Math.ceil(fragments.length / Math.min(size, maxColumns)),
          fragments: fragments.map((f, index) => ({
            id: f.id,
            offsetRow: Math.floor(index / Math.min(size, maxColumns)),
            offsetCol: index % Math.min(size, maxColumns)
          }))
        });
      } else {
        bounds.push({
          groupId,
          width,
          height: maxRow - minRow + 1,
          fragments: fragments.map(f => ({
            id: f.id,
            offsetRow: f.row - minRow,
            offsetCol: f.col - minCol
          }))
        });
      }
    }
    
    return bounds;
  }

  private placeGroups(
    groups: GroupBounds[],
    maxColumns: number,
    priorityGroupId?: string,
    priorityPosition?: { row: number; col: number }
  ): PlacedGroup[] {
    const occupied = new Set<string>();
    const placed: PlacedGroup[] = [];

    if (priorityGroupId && priorityPosition) {
      return this.placeGroupsWithPriority(groups, maxColumns, priorityGroupId, priorityPosition);
    }

    return this.placeGroupsTight(groups, maxColumns);
  }

  private placeGroupsTight(groups: GroupBounds[], maxColumns: number): PlacedGroup[] {
    const occupied = new Set<string>();
    const placed: PlacedGroup[] = [];

    const sorted = [...groups].sort((a, b) => b.fragments.length - a.fragments.length);

    for (const group of sorted) {
      const pos = this.findFirstFit(occupied, group, maxColumns);
      this.occupyFragments(occupied, group, pos);
      placed.push({ ...group, startRow: pos.row, startCol: pos.col });
    }

    return placed;
  }

  private placeGroupsWithPriority(
    groups: GroupBounds[],
    maxColumns: number,
    priorityGroupId: string,
    priorityPos: { row: number; col: number }
  ): PlacedGroup[] {
    const occupied = new Set<string>();
    const placed: PlacedGroup[] = [];

    const priority = groups.find(g => g.groupId === priorityGroupId);
    const others = groups.filter(g => g.groupId !== priorityGroupId);

    if (priority) {
      if (this.canPlaceAt(occupied, priority, priorityPos, maxColumns)) {
        this.occupyFragments(occupied, priority, priorityPos);
        placed.push({ ...priority, startRow: priorityPos.row, startCol: priorityPos.col });
      } else {
        const pos = this.findFirstFit(occupied, priority, maxColumns);
        this.occupyFragments(occupied, priority, pos);
        placed.push({ ...priority, startRow: pos.row, startCol: pos.col });
      }
    }

    for (const group of others) {
      const pos = this.findFirstFit(occupied, group, maxColumns);
      this.occupyFragments(occupied, group, pos);
      placed.push({ ...group, startRow: pos.row, startCol: pos.col });
    }

    return placed;
  }

  private canPlaceAt(
    occupied: Set<string>,
    group: GroupBounds,
    pos: { row: number; col: number },
    maxCols: number
  ): boolean {
    for (const frag of group.fragments) {
      const row = pos.row + frag.offsetRow;
      const col = pos.col + frag.offsetCol;
      if (col >= maxCols || row < 0 || occupied.has(CELL_KEY(row, col))) {
        return false;
      }
    }
    return true;
  }

  private findFirstFit(
    occupied: Set<string>,
    group: GroupBounds,
    maxCols: number
  ): { row: number; col: number } {
    const maxRow = occupied.size > 0 
      ? Math.max(...Array.from(occupied).map(k => parseInt(k.split('_')[0])))
      : -1;

    for (let row = 0; row <= maxRow + 1; row++) {
      for (let col = 0; col < maxCols; col++) {
        if (this.canPlaceAt(occupied, group, { row, col }, maxCols)) {
          return { row, col };
        }
      }
    }

    return { row: maxRow + 1, col: 0 };
  }

  private occupyFragments(
    occupied: Set<string>,
    group: GroupBounds,
    pos: { row: number; col: number }
  ): void {
    for (const frag of group.fragments) {
      occupied.add(CELL_KEY(pos.row + frag.offsetRow, pos.col + frag.offsetCol));
    }
  }

  private createCells(placedGroups: PlacedGroup[], maxColumns: number): { cells: GridCell[]; totalRows: number } {
    const cellMap = new Map<string, GridCell>();
    const fragmentRows = new Set<number>();

    for (const group of placedGroups) {
      for (const fragment of group.fragments) {
        const row = group.startRow + fragment.offsetRow;
        const col = group.startCol + fragment.offsetCol;
        const key = CELL_KEY(row, col);

        cellMap.set(key, {
          id: this.idGenerator.generate(),
          fragmentId: fragment.id,
          groupId: group.groupId,
          row,
          col
        });

        fragmentRows.add(row);
      }
    }

    const maxRow = fragmentRows.size > 0 ? Math.max(...fragmentRows) : 0;

    for (let row = 0; row <= maxRow; row++) {
      for (let col = 0; col < maxColumns; col++) {
        const key = CELL_KEY(row, col);
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            id: this.idGenerator.generate(),
            fragmentId: null,
            groupId: 'default',
            row,
            col
          });
        }
      }
    }

    return {
      cells: Array.from(cellMap.values()).sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      }),
      totalRows: maxRow + 1
    };
  }

  private placeGroupsSequentially(
    existingFragments: Array<{ id: string; groupId: string; row: number; col: number }>,
    newGroups: GroupBounds[],
    maxColumns: number
  ): { cells: GridCell[]; totalRows: number } {
    const occupied = new Set<string>();
    const cellMap = new Map<string, GridCell>();
    const fragmentRows = new Set<number>();
    let maxRow = 0;

    // Размещаем существующие фрагменты, блокируем только сгруппированные
    for (const frag of existingFragments) {
      const key = CELL_KEY(frag.row, frag.col);
      if (frag.groupId !== 'default') {
        occupied.add(key);
      }
      cellMap.set(key, {
        id: this.idGenerator.generate(),
        fragmentId: frag.id,
        groupId: frag.groupId,
        row: frag.row,
        col: frag.col
      });
      fragmentRows.add(frag.row);
      maxRow = Math.max(maxRow, frag.row);
    }

    // Размещаем новые группы последовательно
    for (const group of newGroups) {
      const position = this.findPositionForGroup(occupied, group, maxColumns, maxRow);
      
      // Размещаем фрагменты группы с абсолютными координатами
      for (const fragment of group.fragments) {
        const absRow = position.row + fragment.offsetRow;
        const absCol = position.col + fragment.offsetCol;
        const key = CELL_KEY(absRow, absCol);
        
        occupied.add(key);
        cellMap.set(key, {
          id: this.idGenerator.generate(),
          fragmentId: fragment.id,
          groupId: group.groupId,
          row: absRow,
          col: absCol
        });
        fragmentRows.add(absRow);
        maxRow = Math.max(maxRow, absRow);
      }
    }

    const finalMaxRow = fragmentRows.size > 0 ? Math.max(...fragmentRows) : 0;

    // Заполняем пустые ячейки
    for (let row = 0; row <= finalMaxRow; row++) {
      for (let col = 0; col < maxColumns; col++) {
        const key = CELL_KEY(row, col);
        if (!cellMap.has(key)) {
          cellMap.set(key, {
            id: this.idGenerator.generate(),
            fragmentId: null,
            groupId: 'default',
            row,
            col
          });
        }
      }
    }

    return {
      cells: Array.from(cellMap.values()).sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      }),
      totalRows: finalMaxRow + 1
    };
  }

  private findPositionForGroup(
    occupied: Set<string>,
    group: GroupBounds,
    maxColumns: number,
    currentMaxRow: number
  ): { row: number; col: number } {
    // Ищем позицию, где группа поместится со своей структурой
    for (let row = 0; row <= currentMaxRow + 1; row++) {
      for (let col = 0; col <= maxColumns - group.width; col++) {
        if (this.canPlaceGroupAt(occupied, group, { row, col })) {
          return { row, col };
        }
      }
    }
    
    // Если не нашли - размещаем в новой строке
    return { row: currentMaxRow + 1, col: 0 };
  }

  private canPlaceGroupAt(
    occupied: Set<string>,
    group: GroupBounds,
    pos: { row: number; col: number }
  ): boolean {
    // Проверяем, что все фрагменты группы поместятся
    for (const frag of group.fragments) {
      const row = pos.row + frag.offsetRow;
      const col = pos.col + frag.offsetCol;
      if (occupied.has(CELL_KEY(row, col))) {
        return false;
      }
    }
    return true;
  }

  private createFragmentGroups(groupMap: Map<string, Array<{ id: string; row: number; col: number }>>): FragmentGroup[] {
    return Array.from(groupMap.entries()).map(([id, fragments]) => ({
      id,
      fragmentIds: fragments.map(f => f.id)
    }));
  }

  private createFragmentGroupsSimple(groupMap: Map<string, string[]>): FragmentGroup[] {
    return Array.from(groupMap.entries()).map(([id, fragmentIds]) => ({
      id,
      fragmentIds
    }));
  }

  private createExistingGroupBounds(cells: GridCell[]): GroupBounds[] {
    const groupMap = new Map<string, GridCell[]>();
    
    for (const cell of cells) {
      if (!groupMap.has(cell.groupId)) {
        groupMap.set(cell.groupId, []);
      }
      groupMap.get(cell.groupId)!.push(cell);
    }

    const bounds: GroupBounds[] = [];
    
    for (const [groupId, groupCells] of groupMap.entries()) {
      const minRow = Math.min(...groupCells.map(c => c.row));
      const maxRow = Math.max(...groupCells.map(c => c.row));
      const minCol = Math.min(...groupCells.map(c => c.col));
      const maxCol = Math.max(...groupCells.map(c => c.col));
      
      bounds.push({
        groupId,
        width: maxCol - minCol + 1,
        height: maxRow - minRow + 1,
        fragments: groupCells.map(c => ({
          id: c.fragmentId!,
          offsetRow: c.row - minRow,
          offsetCol: c.col - minCol
        }))
      });
    }
    
    return bounds;
  }

  createGroupFromFragments(layout: GridLayout, cellIds: string[], newGroupId: string): GridLayout {
    const newCells = layout.cells.map(cell => {
      if (cellIds.includes(cell.fragmentId)) {
        return { ...cell, groupId: newGroupId };
      }
      return cell;
    });

    const groups = this.updateGroupsFromCells(newCells);
    return { ...layout, cells: newCells, groups };
  }

  removeFragmentsFromGroup(layout: GridLayout, cellIds: string[]): GridLayout {
    const newCells = layout.cells.map(cell => {
      if (cellIds.includes(cell.fragmentId)) {
        return { ...cell, groupId: 'default' };
      }
      return cell;
    });

    const groups = this.updateGroupsFromCells(newCells);
    return { ...layout, cells: newCells, groups };
  }

  deleteFragments(layout: GridLayout, fragmentIds: string[]): GridLayout {
    const newCells = layout.cells.map(cell => {
      if (cell.fragmentId && fragmentIds.includes(cell.fragmentId)) {
        return { ...cell, fragmentId: null };
      }
      return cell;
    });

    // Находим максимальную строку с непустыми ячейками
    const nonEmptyCells = newCells.filter(c => !isEmptyCell(c));
    if (nonEmptyCells.length === 0) {
      return { columns: layout.columns, rows: 0, cells: [], groups: [] };
    }

    const maxRow = Math.max(...nonEmptyCells.map(c => c.row));
    
    // Фильтруем ячейки, оставляя только до maxRow
    const filteredCells = newCells.filter(c => c.row <= maxRow);
    
    const groups = this.updateGroupsFromCells(filteredCells);
    return { columns: layout.columns, rows: maxRow + 1, cells: filteredCells, groups };
  }

  private updateGroupsFromCells(cells: GridCell[]): FragmentGroup[] {
    const groupMap = new Map<string, string[]>();
    
    for (const cell of cells) {
      if (cell.groupId !== 'default') {
        if (!groupMap.has(cell.groupId)) {
          groupMap.set(cell.groupId, []);
        }
        if (!isEmptyCell(cell)) {
          groupMap.get(cell.groupId)!.push(cell.fragmentId!);
        }
      }
    }
    
    return Array.from(groupMap.entries()).map(([id, fragmentIds]) => ({
      id,
      fragmentIds
    }));
  }
}
