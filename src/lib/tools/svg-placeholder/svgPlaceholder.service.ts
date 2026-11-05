export interface SvgPlaceholderOptions {
  width: number;
  height: number;
  fontSize: number;
  backgroundColor: string;
  textColor: string;
  customText: string;
  useExactSize: boolean;
}

export function buildSvgPlaceholder(options: SvgPlaceholderOptions): string {
  const width = clampSvgWidth(options.width);
  const height = clampSvgHeight(options.height);
  const fontSize = clampSvgFontSize(options.fontSize);
  const text = options.customText.trim() || `${width}x${height}`;
  const sizeAttributes = options.useExactSize ? ` width="${width}" height="${height}"` : "";

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${sizeAttributes}>`,
    `  <rect width="${width}" height="${height}" fill="${escapeSvgAttribute(options.backgroundColor)}"></rect>`,
    `  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="${fontSize}px" fill="${escapeSvgAttribute(options.textColor)}">${escapeSvgText(text)}</text>`,
    "</svg>",
  ].join("\n");
}

export function clampSvgWidth(value: unknown): number {
  return clampDimension(value, 1, 10000, 600);
}

export function clampSvgHeight(value: unknown): number {
  return clampDimension(value, 1, 10000, 350);
}

export function clampSvgFontSize(value: unknown): number {
  return clampDimension(value, 1, 1000, 26);
}

export function buildSvgDataUri(svg: string): string {
  return `data:image/svg+xml;base64,${textToBase64(svg)}`;
}

export function getSvgPlaceholderFilename(width: number, height: number): string {
  return `placeholder-${clampSvgWidth(width)}x${clampSvgHeight(height)}.svg`;
}

export function escapeSvgText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function escapeSvgAttribute(value: string): string {
  return escapeSvgText(value).replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function clampDimension(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, parsed));
}

function textToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return globalThis.btoa(binary);
}
