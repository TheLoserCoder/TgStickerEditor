import { GROUP_COLOR_PALETTE } from './colorPalette';

const colorCache = new Map<string, string>();
const usedColors = new Set<string>();

export function getGroupColor(groupId: string): string {
  if (colorCache.has(groupId)) {
    return colorCache.get(groupId)!;
  }

  for (const color of GROUP_COLOR_PALETTE) {
    if (!usedColors.has(color)) {
      colorCache.set(groupId, color);
      usedColors.add(color);
      return color;
    }
  }

  let hash = 0;
  for (let i = 0; i < groupId.length; i++) {
    hash = ((hash << 5) - hash) + groupId.charCodeAt(i);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % GROUP_COLOR_PALETTE.length;
  const color = GROUP_COLOR_PALETTE[index];
  
  colorCache.set(groupId, color);
  return color;
}

export function releaseGroupColor(groupId: string): void {
  const color = colorCache.get(groupId);
  if (color) {
    usedColors.delete(color);
    colorCache.delete(groupId);
  }
}

export function clearGroupColors(): void {
  colorCache.clear();
  usedColors.clear();
}
