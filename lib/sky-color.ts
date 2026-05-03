export type Hsl = { h: number; s: number; l: number };

export function hexToHsl(hex: string): Hsl {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return { h: 0, s: 0, l: 0 };
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Sky-likeness heuristic. Lets through:
//   - Greys (low S): overcast / smog / rain
//   - Dark hues (low L): night / pre-dawn
//   - Pastels (low S, high L): hazy noon / soft pink dawn
//   - Sunset oranges/reds even at higher S — only flagged if clearly cartoon
// Rejects neon-cartoon hues (saturation > 80% in mid-lightness band) and
// "missing data" pure white.
export function rejectionReason(hex: string): string | null {
  const { s, l } = hexToHsl(hex);
  if (l > 96) return "过亮，看不出是天空——再压低一点亮度？";
  if (s > 82 && l > 32 && l < 68) return "饱和度太高，更像卡通——天空很少这么纯。";
  return null;
}
