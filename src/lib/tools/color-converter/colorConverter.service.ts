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
    placeholder: "e.g. hwb(0 0% 0%)",
    type: "text",
    format: (v) => v.toHwbString(),
  },
  {
    id: "lch",
    label: "lch",
    placeholder: "e.g. lch(53.24% 104.55 40.85)",
    type: "text",
    format: (v) => v.toLchString(),
  },
  {
    id: "cmyk",
    label: "cmyk",
    placeholder: "e.g. device-cmyk(0% 100% 100% 0%)",
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
    const parsed = colord(value.trim());
    return parsed.isValid() ? parsed : undefined;
  }, undefined);
}

/** The hex field also takes a pasted `ff0000`. Elsewhere that could be a name, so `#` stays required. */
function parseColorField(id: ColorFormatId, raw: string): Colord | undefined {
  const value = raw.trim();
  const needsHash = id === "hex" && /^[0-9a-f]{3,8}$/i.test(value);
  return parseColor(needsHash ? `#${value}` : value);
}

/** Empty input is treated as valid (matches it-tools validation). */
export function isColorInputValid(value: string, id?: ColorFormatId): boolean {
  if (value === "") {
    return true;
  }
  return (id ? parseColorField(id, value) : parseColor(value)) !== undefined;
}

/** The opacity of what the fields describe, from 0 to 1. Prefers rgb, since hex may be mid-edit. */
export function alphaOf(values: ColorValues): number {
  return (parseColor(values.rgb) ?? parseColor(values.hex))?.alpha() ?? 1;
}

/** An opaque picker hex plus an alpha, as an `#rrggbbaa` hex. */
export function withAlpha(hex: string, alpha: number): string {
  return parseColor(hex)?.alpha(alpha).toHex() ?? hex;
}

/** What the swatch shows: the hex field if it parses, or else the last good color. */
export function previewColor(values: ColorValues): string {
  return parseColorField("hex", values.hex)?.toHex() ?? withAlpha(values.picker, alphaOf(values));
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
  const parsed = parseColorField(sourceId, raw);

  if (!parsed) {
    return { values: next, valid: raw === "" };
  }

  for (const format of COLOR_FORMATS) {
    if (format.id !== sourceId) {
      next[format.id] = format.format(parsed);
    }
  }
  // The native picker only holds opaque hex, even when an alpha came along with the edit.
  next.picker = toPickerHex(parsed);

  return { values: next, valid: true };
}

export function invalidMessageFor(formatId: ColorFormatId): string {
  const label = FORMAT_BY_ID[formatId]?.label ?? formatId;
  return `Invalid ${label.toLowerCase()} format.`;
}
