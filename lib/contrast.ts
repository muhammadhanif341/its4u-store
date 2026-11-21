/** WCAG 2.x contrast helpers, used by the design tests so the palette stays readable. */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) throw new Error(`Not a hex colour: ${hex}`);
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Lays a colour with some opacity (0 to 1) over a solid background and returns the resulting solid colour. */
export function blend(fg: string, alpha: number, bg: string): string {
  const a = Math.min(1, Math.max(0, alpha));
  const f = hexToRgb(fg);
  const b = hexToRgb(bg);
  const mix = (i: number) => Math.round(f[i] * a + b[i] * (1 - a));
  return `#${[0, 1, 2].map((i) => mix(i).toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

/** Contrast ratio between two colours, from 1 (same) to 21 (black on white). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
