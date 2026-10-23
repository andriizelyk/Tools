export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

export function parseColor(input: string): Rgb | null {
  const text = input.trim().toLowerCase();

  const hex = text.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }

  const nums = (body: string) => body.split(/[\s,/]+/).filter(Boolean);

  const rgb = text.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const [r, g, b] = nums(rgb[1]).slice(0, 3).map(Number);
    if ([r, g, b].some((v) => Number.isNaN(v))) return null;
    return { r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255) };
  }

  const hsl = text.match(/^hsla?\(([^)]+)\)$/);
  if (hsl) {
    const [h, s, l] = nums(hsl[1]).slice(0, 3).map((v) => parseFloat(v));
    if ([h, s, l].some((v) => Number.isNaN(v))) return null;
    return hslToRgb({ h, s, l });
  }
  return null;
}

export const rgbToHex = ({ r, g, b }: Rgb) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: l * 100 };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hh = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + hh / 30) % 12;
  const a = sn * Math.min(ln, 1 - ln);
  const f = (n: number) => ln - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

export const formatRgb = ({ r, g, b }: Rgb) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

export const formatHsl = (rgb: Rgb) => {
  const { h, s, l } = rgbToHsl(rgb);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
};

function luminance({ r, g, b }: Rgb) {
  const [R, G, B] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const readableTextOn = (bg: Rgb) => (contrastRatio(bg, { r: 0, g: 0, b: 0 }) > 7 ? '#000000' : '#ffffff');

export interface Swatch {
  label: string;
  hex: string;
}

export function palettes(rgb: Rgb): { title: string; swatches: Swatch[] }[] {
  const { h, s, l } = rgbToHsl(rgb);
  const at = (hue: number, light = l) => rgbToHex(hslToRgb({ h: hue, s, l: light }));
  const lights = [95, 85, 75, 65, 55, 45, 35, 25, 15];
  return [
    { title: 'Shades & tints', swatches: lights.map((light) => ({ label: `L${light}`, hex: at(h, light) })) },
    {
      title: 'Complementary',
      swatches: [
        { label: 'Base', hex: at(h) },
        { label: '180°', hex: at(h + 180) },
      ],
    },
    {
      title: 'Analogous',
      swatches: [-30, 0, 30].map((d) => ({ label: `${d > 0 ? '+' : ''}${d}°`, hex: at(h + d) })),
    },
    {
      title: 'Triadic',
      swatches: [0, 120, 240].map((d) => ({ label: `${d}°`, hex: at(h + d) })),
    },
    {
      title: 'Tetradic',
      swatches: [0, 90, 180, 270].map((d) => ({ label: `${d}°`, hex: at(h + d) })),
    },
  ];
}
