/**
 * Color converter — port of it-tools color-converter via colord
 * (hex, rgb, hsl, hwb, lch, cmyk, CSS name + closest name).
 */

import { type Colord, colord, extend } from "colord";
import cmykPlugin from "colord/plugins/cmyk";
import hwbPlugin from "colord/plugins/hwb";
import lchPlugin from "colord/plugins/lch";
import namesPlugin from "colord/plugins/names";

extend([cmykPlugin, hwbPlugin, namesPlugin, lchPlugin]);

export type ColorFormatId =
  | "picker"
  | "hex"
  | "rgb"
  | "hsl"
  | "hwb"
  | "lch"
  | "cmyk"
  | "name";

export type ColorValues = Record<ColorFormatId, string>;

export type ColorFormatDef = {
  id: ColorFormatId;
  label: string;
  placeholder: string;
  type: "text" | "color-picker";
  format: (value: Colord) => string;
};

/** Default seed color — matches it-tools (`#1ea54c`). */
export const DEFAULT_COLOR_HEX = "#1ea54c";

export function removeAlphaChannelWhenOpaque(hexColor: string): string {
  return hexColor.replace(/^(#(?:[0-9a-f]{3}){1,2})ff$/i, "$1");
}

function withDefaultOnError<T>(fn: () => T, fallback: T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/** Native `<input type="color">` only accepts opaque `#rrggbb`. */
function toPickerHex(value: Colord): string {
  const hex = value.toHex();
  if (hex.length === 9) {
    return hex.slice(0, 7);
  }
  return removeAlphaChannelWhenOpaque(hex);
}

export const COLOR_FORMATS: readonly ColorFormatDef[] = [
  {
    id: "picker",
    label: "color picker",
    placeholder: "",
    type: "color-picker",
    format: toPickerHex,
  },
  {
    id: "hex",
    label: "hex",
    placeholder: "e.g. #ff0000",
    type: "text",
    format: (v) => v.toHex(),
  },
  {
    id: "rgb",
    label: "rgb",
    placeholder: "e.g. rgb(255, 0, 0)",
    type: "text",
    format: (v) => v.toRgbString(),
  },
  {
    id: "hsl",
    label: "hsl",
    placeholder: "e.g. hsl(0, 100%, 50%)",
    type: "text",
    format: (v) => v.toHslString(),
  },
  {
    id: "hwb",
    label: "hwb",
    placeholder: "e.g. hwb(0, 0%, 0%)",
    type: "text",
    format: (v) => v.toHwbString(),
  },
  {
    id: "lch",
    label: "lch",
    placeholder: "e.g. lch(53.24, 104.55, 40.85)",
    type: "text",
    format: (v) => v.toLchString(),
  },
  {
    id: "cmyk",
    label: "cmyk",
    placeholder: "e.g. cmyk(0, 100%, 100%, 0)",
    type: "text",
    format: (v) => v.toCmykString(),
  },
  {
    id: "name",
    label: "name",
    placeholder: "e.g. red",
    type: "text",
    format: (v) => v.toName({ closest: true }) ?? "Unknown",
  },
] as const;

const FORMAT_BY_ID = Object.fromEntries(
  COLOR_FORMATS.map((format) => [format.id, format]),
) as Record<ColorFormatId, ColorFormatDef>;

export function parseColor(value: string): Colord | undefined {
  return withDefaultOnError(() => {
    const parsed = colord(value);
    return parsed.isValid() ? parsed : undefined;
  }, undefined);
}

/** Empty input is treated as valid (matches it-tools validation). */
export function isColorInputValid(value: string): boolean {
  if (value === "") {
    return true;
  }
  return parseColor(value) !== undefined;
}

export function formatAll(color: Colord): ColorValues {
  const values = {} as ColorValues;
  for (const format of COLOR_FORMATS) {
    values[format.id] = format.format(color);
  }
  return values;
}

export function initialColorValues(
  hex: string = DEFAULT_COLOR_HEX,
): ColorValues {
  const color = parseColor(hex);
  if (!color) {
    throw new Error(`Invalid default color: ${hex}`);
  }
  return formatAll(color);
}

/**
 * Apply an edited field. Keeps the raw source value; reformats all other
 * fields when the parse succeeds (it-tools `updateColorValue` behavior).
 */
export function applyColorInput(
  current: ColorValues,
  sourceId: ColorFormatId,
  raw: string,
): { values: ColorValues; valid: boolean } {
  const next: ColorValues = { ...current, [sourceId]: raw };
  const parsed = parseColor(raw);

  if (!parsed) {
    return { values: next, valid: raw === "" };
  }

  for (const format of COLOR_FORMATS) {
    if (format.id !== sourceId) {
      next[format.id] = format.format(parsed);
    }
  }

  return { values: next, valid: true };
}

export function invalidMessageFor(formatId: ColorFormatId): string {
  const label = FORMAT_BY_ID[formatId]?.label ?? formatId;
  return `Invalid ${label.toLowerCase()} format.`;
}
