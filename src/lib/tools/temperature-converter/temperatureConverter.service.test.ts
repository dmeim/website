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
  parseTemperatureInput,
  roundTemperature,
} from "./temperatureConverter.service";

describe("temperature-converter", () => {
  describe("roundTemperature", () => {
    it("floors toward −∞ at two decimals (it-tools)", () => {
      expect(roundTemperature(273.159)).toBe(273.15);
      expect(roundTemperature(-273.151)).toBe(-273.16);
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
    it("keeps the source value and floors other scales from 0 K", () => {
      const values = convertFromScale("kelvin", 0);
      expect(values.kelvin).toBe(0);
      expect(values.celsius).toBe(-273.15);
      expect(values.fahrenheit).toBe(-459.67);
      expect(values.rankine).toBe(0);
      expect(values.delisle).toBe(559.72);
      expect(values.newton).toBe(-90.14);
      expect(values.reaumur).toBe(-218.52);
      expect(values.romer).toBe(-135.91);
    });

    it("converts from Celsius water freezing point (floors float noise)", () => {
      const values = convertFromScale("celsius", 0);
      expect(values.celsius).toBe(0);
      // 273.15 * 100 is just under 27315 in IEEE float → floors to 273.14
      expect(values.kelvin).toBe(273.14);
      expect(values.fahrenheit).toBe(31.99);
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
    it("starts at 0 K with floored equivalents", () => {
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
});
