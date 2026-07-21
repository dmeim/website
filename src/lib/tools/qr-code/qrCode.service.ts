import * as QRCode from "qrcode";
import type { QRCodeErrorCorrectionLevel } from "qrcode";

export type QrErrorCorrectionLevel = Extract<
  QRCodeErrorCorrectionLevel,
  "L" | "M" | "Q" | "H"
>;

export const QR_ERROR_CORRECTION_LEVELS: Array<{
  value: QrErrorCorrectionLevel;
  label: string;
  description: string;
}> = [
  { value: "L", label: "Low", description: "~7% recovery" },
  { value: "M", label: "Medium", description: "~15% recovery" },
  { value: "Q", label: "Quartile", description: "~25% recovery" },
  { value: "H", label: "High", description: "~30% recovery" },
];

export interface QrRenderOptions {
  text: string;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: QrErrorCorrectionLevel;
  size: number;
  margin: number;
}

export function normalizeQrText(text: string): string {
  return text.trim();
}

export function isQrTextValid(text: string): boolean {
  return normalizeQrText(text).length > 0;
}

export async function renderQrPngDataUrl(options: QrRenderOptions): Promise<string> {
  const text = normalizeQrText(options.text);

  if (!text) {
    return "";
  }

  return QRCode.toDataURL(text, {
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    width: options.size,
  });
}

export async function renderQrSvg(options: QrRenderOptions): Promise<string> {
  const text = normalizeQrText(options.text);

  if (!text) {
    return "";
  }

  return QRCode.toString(text, {
    color: {
      dark: options.foregroundColor,
      light: options.backgroundColor,
    },
    errorCorrectionLevel: options.errorCorrectionLevel,
    margin: options.margin,
    type: "svg",
  });
}
