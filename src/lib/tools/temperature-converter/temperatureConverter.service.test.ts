import { describe, expect, it } from "vitest";

import {
  convertCelsiusToKelvin,
  convertDelisleToKelvin,
  convertFahrenheitToKelvin,
  convertFromScale,
  convertKelvinToCelsius,
  convertKelvinToDelisle,
  convertKelvinToFahrenheit,
  convertKelvinToNewton,
  convertKelvinToRankine,
  convertKelvinToReaumur,
  convertKelvinToRomer,
  convertNewtonToKelvin,
  convertRankineToKelvin,
  convertReaumurToKelvin,
  convertRomerToKelvin,
  initialTemperatures,
  isBelowAbsoluteZero,
  parseTemperatureInput,
  roundTemperature,
} from "./temperatureConverter.service";

describe("temperature-converter", () => {
  describe("roundTemperature", () => {
    it("rounds to two decimals, not down", () => {
      expect(roundTemperature(273.159)).toBe(273.16);
      expect(roundTemperature(-273.151)).toBe(-273.15);
      expect(roundTemperature(31.999999999999943)).toBe(32);
      expect(roundTemperature(211.99999999999994)).toBe(212);
      expect(roundTemperature(559.7249999999999)).toBe(559.73);
      expect(roundTemperature(0)).toBe(0);
    });
  });

  describe("scale ↔ Kelvin helpers", () => {
    it("round-trips common freezing / boiling points", () => {
      expect(convertCelsiusToKelvin(0)).toBe(273.15);
      expect(convertKelvinToCelsius(273.15)).toBe(0);

      expect(convertFahrenheitToKelvin(32)).toBeCloseTo(273.15, 10);
      expect(convertKelvinToFahrenheit(273.15)).toBeCloseTo(32, 10);

      expect(convertRankineToKelvin(491.67)).toBeCloseTo(273.15, 10);
      expect(convertKelvinToRankine(273.15)).toBeCloseTo(491.67, 10);

      expect(convertDelisleToKelvin(0)).toBe(373.15);
      expect(convertKelvinToDelisle(373.15)).toBe(0);

      expect(convertNewtonToKelvin(0)).toBe(273.15);
      expect(convertKelvinToNewton(273.15)).toBe(0);

      expect(convertReaumurToKelvin(0)).toBe(273.15);
      expect(convertKelvinToReaumur(273.15)).toBe(0);

      expect(convertRomerToKelvin(7.5)).toBe(273.15);
      expect(convertKelvinToRomer(273.15)).toBe(7.5);
    });
  });

  describe("convertFromScale", () => {
    it("keeps the source value and rounds other scales from 0 K", () => {
      const values = convertFromScale("kelvin", 0);
      expect(values.kelvin).toBe(0);
      expect(values.celsius).toBe(-273.15);
      expect(values.fahrenheit).toBe(-459.67);
      expect(values.rankine).toBe(0);
      expect(values.delisle).toBe(559.73);
      expect(values.newton).toBe(-90.14);
      expect(values.reaumur).toBe(-218.52);
      expect(values.romer).toBe(-135.9);
    });

    it("converts from Celsius water freezing point without float noise", () => {
      const values = convertFromScale("celsius", 0);
      expect(values.celsius).toBe(0);
      expect(values.kelvin).toBe(273.15);
      expect(values.fahrenheit).toBe(32);
      expect(values.newton).toBe(0);
      expect(values.reaumur).toBe(0);
      expect(values.romer).toBe(7.5);
    });

    it("converts from Fahrenheit water freezing point", () => {
      const values = convertFromScale("fahrenheit", 32);
      expect(values.fahrenheit).toBe(32);
      expect(values.celsius).toBe(0);
      expect(values.kelvin).toBe(273.15);
    });

    it("does not mutate the edited scale when converting from Rankine", () => {
      const values = convertFromScale("rankine", 491.67);
      expect(values.rankine).toBe(491.67);
      expect(values.celsius).toBe(0);
    });
  });

  describe("initialTemperatures", () => {
    it("starts at 0 K with rounded equivalents", () => {
      expect(initialTemperatures()).toEqual(convertFromScale("kelvin", 0));
    });
  });

  describe("parseTemperatureInput", () => {
    it("returns undefined for empty or invalid input", () => {
      expect(parseTemperatureInput("")).toBeUndefined();
      expect(parseTemperatureInput("   ")).toBeUndefined();
      expect(parseTemperatureInput("abc")).toBeUndefined();
    });

    it("parses finite numbers", () => {
      expect(parseTemperatureInput("0")).toBe(0);
      expect(parseTemperatureInput("-273.15")).toBe(-273.15);
      expect(parseTemperatureInput("32")).toBe(32);
    });
  });

  describe("published reference points, from every scale", () => {
    // Water's freezing and boiling points and absolute zero, from the standard scale definitions.
    const points = [
      { kelvin: 273.15, celsius: 0, fahrenheit: 32, rankine: 491.67, delisle: 150, newton: 0, reaumur: 0, romer: 7.5 },
      { kelvin: 373.15, celsius: 100, fahrenheit: 212, rankine: 671.67, delisle: 0, newton: 33, reaumur: 80, romer: 60 },
      { kelvin: 0, celsius: -273.15, fahrenheit: -459.67, rankine: 0, delisle: 559.73, newton: -90.14, reaumur: -218.52, romer: -135.9 },
    ];

    for (const point of points) {
      for (const [scale, value] of Object.entries(point) as [keyof typeof point, number][]) {
        // 559.73 is itself rounded from 559.725, so converting back from it lands a hair off.
        if (point.kelvin === 0 && ["delisle", "newton", "reaumur", "romer"].includes(scale)) continue;
        it(`${value} on ${scale}`, () => {
          expect(convertFromScale(scale, value)).toEqual(point);
        });
      }
    }

    it("meets at -40 on Celsius and Fahrenheit", () => {
      expect(convertFromScale("celsius", -40).fahrenheit).toBe(-40);
      expect(convertFromScale("fahrenheit", -40).celsius).toBe(-40);
    });

    it("converts body temperature", () => {
      expect(convertFromScale("celsius", 37)).toMatchObject({ kelvin: 310.15, fahrenheit: 98.6, rankine: 558.27, delisle: 94.5, newton: 12.21, reaumur: 29.6, romer: 26.93 });
    });
  });

  describe("isBelowAbsoluteZero", () => {
    it("flags values under 0 K on any scale", () => {
      expect(isBelowAbsoluteZero("kelvin", -1)).toBe(true);
      expect(isBelowAbsoluteZero("celsius", -273.16)).toBe(true);
      expect(isBelowAbsoluteZero("fahrenheit", -460)).toBe(true);
      expect(isBelowAbsoluteZero("delisle", 560)).toBe(true);
    });

    it("allows absolute zero itself, despite float noise", () => {
      expect(isBelowAbsoluteZero("kelvin", 0)).toBe(false);
      expect(isBelowAbsoluteZero("celsius", -273.15)).toBe(false);
      expect(isBelowAbsoluteZero("fahrenheit", -459.67)).toBe(false);
      expect(isBelowAbsoluteZero("delisle", 559.725)).toBe(false);
      expect(isBelowAbsoluteZero("delisle", 0)).toBe(false);
    });
  });
});
