/**
 * Temperature scale conversions via Kelvin (it-tools temperature-converter parity).
 */

export type TemperatureScale =
  | "kelvin"
  | "celsius"
  | "fahrenheit"
  | "rankine"
  | "delisle"
  | "newton"
  | "reaumur"
  | "romer";

export type TemperatureScaleMeta = {
  id: TemperatureScale;
  title: string;
  unit: string;
};

export const TEMPERATURE_SCALES: readonly TemperatureScaleMeta[] = [
  { id: "kelvin", title: "Kelvin", unit: "K" },
  { id: "celsius", title: "Celsius", unit: "°C" },
  { id: "fahrenheit", title: "Fahrenheit", unit: "°F" },
  { id: "rankine", title: "Rankine", unit: "°R" },
  { id: "delisle", title: "Delisle", unit: "°De" },
  { id: "newton", title: "Newton", unit: "°N" },
  { id: "reaumur", title: "Réaumur", unit: "°Ré" },
  { id: "romer", title: "Rømer", unit: "°Rø" },
] as const;

export const convertCelsiusToKelvin = (temperature: number) => temperature + 273.15;
export const convertKelvinToCelsius = (temperature: number) => temperature - 273.15;

export const convertFahrenheitToKelvin = (temperature: number) =>
  (temperature + 459.67) * (5 / 9);
export const convertKelvinToFahrenheit = (temperature: number) =>
  temperature * (9 / 5) - 459.67;

export const convertRankineToKelvin = (temperature: number) => temperature * (5 / 9);
export const convertKelvinToRankine = (temperature: number) => temperature * (9 / 5);

export const convertDelisleToKelvin = (temperature: number) =>
  373.15 - (2 / 3) * temperature;
export const convertKelvinToDelisle = (temperature: number) =>
  (3 / 2) * (373.15 - temperature);

export const convertNewtonToKelvin = (temperature: number) =>
  temperature * (100 / 33) + 273.15;
export const convertKelvinToNewton = (temperature: number) =>
  (temperature - 273.15) * (33 / 100);

export const convertReaumurToKelvin = (temperature: number) =>
  temperature * (5 / 4) + 273.15;
export const convertKelvinToReaumur = (temperature: number) =>
  (temperature - 273.15) * (4 / 5);

export const convertRomerToKelvin = (temperature: number) =>
  (temperature - 7.5) * (40 / 21) + 273.15;
export const convertKelvinToRomer = (temperature: number) =>
  (temperature - 273.15) * (21 / 40) + 7.5;

const toKelvin: Record<TemperatureScale, (v: number) => number> = {
  kelvin: (v) => v,
  celsius: convertCelsiusToKelvin,
  fahrenheit: convertFahrenheitToKelvin,
  rankine: convertRankineToKelvin,
  delisle: convertDelisleToKelvin,
  newton: convertNewtonToKelvin,
  reaumur: convertReaumurToKelvin,
  romer: convertRomerToKelvin,
};

const fromKelvin: Record<TemperatureScale, (v: number) => number> = {
  kelvin: (v) => v,
  celsius: convertKelvinToCelsius,
  fahrenheit: convertKelvinToFahrenheit,
  rankine: convertKelvinToRankine,
  delisle: convertKelvinToDelisle,
  newton: convertKelvinToNewton,
  reaumur: convertKelvinToReaumur,
  romer: convertKelvinToRomer,
};

/** Truncate toward −∞ to two decimal places (matches it-tools `Math.floor(n * 100) / 100`). */
export function roundTemperature(value: number): number {
  return Math.floor(value * 100) / 100;
}

/**
 * Convert a value on `source` into all scales.
 * The source scale keeps `value` unchanged; others are floored to 2 decimals.
 */
export function convertFromScale(
  source: TemperatureScale,
  value: number,
): Record<TemperatureScale, number> {
  const kelvins = toKelvin[source](value);
  const result = {} as Record<TemperatureScale, number>;

  for (const { id } of TEMPERATURE_SCALES) {
    result[id] = id === source ? value : roundTemperature(fromKelvin[id](kelvins));
  }

  return result;
}

/** Parse a controlled number-input string; empty / invalid → `undefined`. */
export function parseTemperatureInput(raw: string): number | undefined {
  if (raw.trim() === "") {
    return undefined;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

/** Default linked values: 0 K and the floored equivalents on every other scale. */
export function initialTemperatures(): Record<TemperatureScale, number> {
  return convertFromScale("kelvin", 0);
}
