import QRCode, { type QRCodeToDataURLOptions } from 'qrcode';

export type TitlePosition = 'top' | 'bottom';

export interface TitleOptions {
  text: string;
  position: TitlePosition;
  /** Font size as a percentage of the QR code width. */
  scale: number;
  color: string;
  background: string;
}

interface TitleLayout {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  padding: number;
  height: number;
}

const FONT = '"Inter", "Roboto", "Helvetica", "Arial", sans-serif';
const font = (size: number) => `600 ${size}px ${FONT}`;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    lines.push(line);
  }
  return lines;
}

function layoutTitle(title: TitleOptions, width: number): TitleLayout | null {
  if (!title.text.trim()) return null;
  const ctx = document.createElement('canvas').getContext('2d')!;
  const fontSize = Math.max(8, Math.round((width * title.scale) / 100));
  ctx.font = font(fontSize);
  const padding = Math.round(fontSize * 0.6);
  const lines = wrapLines(ctx, title.text.trim(), width - padding * 2);
  const lineHeight = Math.round(fontSize * 1.25);
  return { lines, fontSize, lineHeight, padding, height: lines.length * lineHeight + padding * 2 };
}

const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export async function renderPng(text: string, qr: QRCodeToDataURLOptions & { width: number }, title: TitleOptions): Promise<string> {
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, text, qr);
  const layout = layoutTitle(title, qrCanvas.width);
  if (!layout) return qrCanvas.toDataURL('image/png');

  const out = document.createElement('canvas');
  out.width = qrCanvas.width;
  out.height = qrCanvas.height + layout.height;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = title.background;
  ctx.fillRect(0, 0, out.width, out.height);

  const qrY = title.position === 'top' ? layout.height : 0;
  const blockY = title.position === 'top' ? 0 : qrCanvas.height;
  ctx.drawImage(qrCanvas, 0, qrY);

  ctx.fillStyle = title.color;
  ctx.font = font(layout.fontSize);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  layout.lines.forEach((line, i) => {
    ctx.fillText(line, out.width / 2, blockY + layout.padding + layout.lineHeight * (i + 0.5));
  });
  return out.toDataURL('image/png');
}

export async function renderSvg(text: string, qr: QRCodeToDataURLOptions & { width: number }, title: TitleOptions): Promise<string> {
  const svg = await QRCode.toString(text, { ...qr, type: 'svg' });
  const layout = layoutTitle(title, qr.width);
  if (!layout) return svg;

  const width = qr.width;
  const height = width + layout.height;
  const qrY = title.position === 'top' ? layout.height : 0;
  const blockY = title.position === 'top' ? 0 : width;
  const inner = svg.replace(/^<\?xml[^>]*\?>\s*/, '').replace('<svg ', `<svg x="0" y="${qrY}" `);
  const texts = layout.lines
    .map(
      (line, i) =>
        `<text x="${width / 2}" y="${blockY + layout.padding + layout.lineHeight * (i + 0.5)}" text-anchor="middle" dominant-baseline="central" font-family='${FONT}' font-weight="600" font-size="${layout.fontSize}" fill="${title.color}">${escapeXml(line)}</text>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${title.background}"/>${inner}${texts}</svg>`;
}
