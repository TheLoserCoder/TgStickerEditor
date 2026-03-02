function generateColorPalette(count: number): string[] {
  const colors: string[] = [];
  const goldenRatio = 0.618033988749895;
  let hue = Math.random();
  
  for (let i = 0; i < count; i++) {
    hue = (hue + goldenRatio) % 1;
    const saturation = 0.6 + (i % 3) * 0.15;
    const lightness = 0.5 + (i % 4) * 0.1;
    colors.push(hslToHex(hue * 360, saturation * 100, lightness * 100));
  }
  
  return colors;
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const GROUP_COLOR_PALETTE = generateColorPalette(200);
