import { describe, expect, it } from "vitest";

import {
  camelCase,
  capitalCase,
  constantCase,
  convertAllCases,
  DEFAULT_CASE_INPUT,
  dotCase,
  headerCase,
  mockingCase,
  noCase,
  paramCase,
  pascalCase,
  pathCase,
  sentenceCase,
  snakeCase,
} from "./caseConverter.service";

describe("case-converter", () => {
  describe("convertAllCases — default sample", () => {
    it("matches it-tools / change-case@4 outputs for the default string", () => {
      const byId = Object.fromEntries(
        convertAllCases(DEFAULT_CASE_INPUT).map((f) => [f.id, f.value]),
      );

      expect(byId).toEqual({
        lowercase: "lorem ipsum dolor sit amet",
        uppercase: "LOREM IPSUM DOLOR SIT AMET",
        camelcase: "loremIpsumDolorSitAmet",
        capitalcase: "Lorem Ipsum Dolor Sit Amet",
        constantcase: "LOREM_IPSUM_DOLOR_SIT_AMET",
        dotcase: "lorem.ipsum.dolor.sit.amet",
        headercase: "Lorem-Ipsum-Dolor-Sit-Amet",
        nocase: "lorem ipsum dolor sit amet",
        paramcase: "lorem-ipsum-dolor-sit-amet",
        pascalcase: "LoremIpsumDolorSitAmet",
        pathcase: "lorem/ipsum/dolor/sit/amet",
        sentencecase: "Lorem ipsum dolor sit amet",
        snakecase: "lorem_ipsum_dolor_sit_amet",
        mockingcase: "LoReM IpSuM DoLoR SiT AmEt",
      });
    });

    it("returns formats in it-tools display order with labels", () => {
      const formats = convertAllCases("x");
      expect(formats.map((f) => f.label)).toEqual([
        "Lowercase",
        "Uppercase",
        "Camelcase",
        "Capitalcase",
        "Constantcase",
        "Dotcase",
        "Headercase",
        "Nocase",
        "Paramcase",
        "Pascalcase",
        "Pathcase",
        "Sentencecase",
        "Snakecase",
        "Mockingcase",
      ]);
    });
  });

  describe("word-boundary splitting", () => {
    it("splits camelCase and acronyms like change-case", () => {
      expect(camelCase("fooBar")).toBe("fooBar");
      expect(pascalCase("fooBar")).toBe("FooBar");
      expect(snakeCase("fooBar")).toBe("foo_bar");
      expect(paramCase("XMLHttpRequest")).toBe("xml-http-request");
      expect(constantCase("XMLHttpRequest")).toBe("XML_HTTP_REQUEST");
      expect(capitalCase("XMLHttpRequest")).toBe("Xml Http Request");
      expect(sentenceCase("XMLHttpRequest")).toBe("Xml http request");
      expect(headerCase("XMLHttpRequest")).toBe("Xml-Http-Request");
      expect(pathCase("XMLHttpRequest")).toBe("xml/http/request");
      expect(dotCase("XMLHttpRequest")).toBe("xml.http.request");
      expect(noCase("XMLHttpRequest")).toBe("xml http request");
    });

    it("strips punctuation / underscores as separators (custom stripRegexp)", () => {
      expect(camelCase("hello-world_test")).toBe("helloWorldTest");
      expect(snakeCase("hello-world_test")).toBe("hello_world_test");
      expect(paramCase("hello-world_test")).toBe("hello-world-test");
    });

    it("keeps accented Latin letters as word characters", () => {
      expect(camelCase("déjà vu!")).toBe("déjàVu");
      expect(capitalCase("déjà vu!")).toBe("Déjà Vu");
      expect(constantCase("déjà vu!")).toBe("DÉJÀ_VU");
      expect(noCase("déjà vu!")).toBe("déjà vu");
    });
  });

  describe("edge cases", () => {
    it("handles empty string and single character", () => {
      expect(convertAllCases("").every((f) => f.value === "")).toBe(true);
      expect(camelCase("a")).toBe("a");
      expect(pascalCase("a")).toBe("A");
      expect(constantCase("a")).toBe("A");
      expect(mockingCase("a")).toBe("A");
    });

    it("mockingCase alternates by index and preserves separators", () => {
      expect(mockingCase("hello-world_test")).toBe("HeLlO-WoRlD_TeSt");
      expect(mockingCase("déjà vu!")).toBe("DéJà vU!");
    });

    it("lower/upper use locale case (parity with it-tools toLocale*)", () => {
      const formats = convertAllCases("İstanbul");
      expect(formats.find((f) => f.id === "lowercase")?.value).toBe(
        "İstanbul".toLocaleLowerCase(),
      );
      expect(formats.find((f) => f.id === "uppercase")?.value).toBe(
        "İstanbul".toLocaleUpperCase(),
      );
    });
  });
});
