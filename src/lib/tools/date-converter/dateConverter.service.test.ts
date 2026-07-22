import { describe, expect, it } from "vitest";

import {
  DATE_FORMATS,
  DEFAULT_FORMAT_INDEX,
  dateToExcelFormat,
  detectFormatIndex,
  excelFormatToDate,
  formatAll,
  formatISO,
  formatISO9075,
  formatRFC3339,
  formatRFC7231,
  isExcelFormat,
  isISO8601DateTimeString,
  isISO9075DateString,
  isInputValid,
  isMongoObjectId,
  isRFC3339DateString,
  isRFC7231DateString,
  isTimestamp,
  isUTCDateString,
  isUnixTimestamp,
  resolveDate,
} from "./dateConverter.service";

describe("date-converter", () => {
  describe("isISO8601DateTimeString", () => {
    it("accepts valid ISO 8601 date strings", () => {
      expect(isISO8601DateTimeString("2021-01-01T00:00:00.000Z")).toBe(true);
      expect(isISO8601DateTimeString("2023-04-12T14:56:00+01:00")).toBe(true);
      expect(isISO8601DateTimeString("20230412T145600+0100")).toBe(true);
      expect(isISO8601DateTimeString("20230412T145600Z")).toBe(true);
      expect(isISO8601DateTimeString("2016-02-01")).toBe(true);
      expect(isISO8601DateTimeString("2016")).toBe(true);
    });

    it("rejects invalid ISO 8601 date strings", () => {
      expect(isISO8601DateTimeString()).toBe(false);
      expect(isISO8601DateTimeString("")).toBe(false);
      expect(isISO8601DateTimeString("qsdqsd")).toBe(false);
      expect(isISO8601DateTimeString("2016-02-01-")).toBe(false);
      expect(isISO8601DateTimeString("2021-01-01T00:00:00.")).toBe(false);
    });
  });

  describe("isISO9075DateString", () => {
    it("accepts valid ISO 9075 date strings", () => {
      expect(isISO9075DateString("2022-01-01 12:00:00Z")).toBe(true);
      expect(isISO9075DateString("2022-01-01 12:00:00.123456Z")).toBe(true);
      expect(isISO9075DateString("2022-01-01 12:00:00+01:00")).toBe(true);
      expect(isISO9075DateString("2022-01-01 12:00:00-05:00")).toBe(true);
    });

    it("rejects invalid ISO 9075 date strings", () => {
      expect(isISO9075DateString("2022/01/01T12:00:00Z")).toBe(false);
      expect(isISO9075DateString("2022-01-01 12:00:00.123456789Z")).toBe(false);
      expect(isISO9075DateString("2022-01-01 12:00:00+1:00")).toBe(false);
      expect(isISO9075DateString("2022-01-01 12:00:00-05:")).toBe(false);
      expect(isISO9075DateString("2022-01-01 12:00:00-05:00:00")).toBe(false);
      expect(isISO9075DateString("2022-01-01")).toBe(false);
      expect(isISO9075DateString("12:00:00Z")).toBe(false);
      expect(isISO9075DateString("2022-01-01T12:00:00Zfoo")).toBe(false);
    });
  });

  describe("isRFC3339DateString", () => {
    it("accepts valid RFC 3339 date strings", () => {
      expect(isRFC3339DateString("2022-01-01T12:00:00Z")).toBe(true);
      expect(isRFC3339DateString("2022-01-01T12:00:00.123456789Z")).toBe(true);
      expect(isRFC3339DateString("2022-01-01T12:00:00.123456789+01:00")).toBe(
        true,
      );
      expect(isRFC3339DateString("2022-01-01T12:00:00-05:00")).toBe(true);
    });

    it("rejects invalid RFC 3339 date strings", () => {
      expect(isRFC3339DateString("2022/01/01T12:00:00Z")).toBe(false);
      expect(isRFC3339DateString("2022-01-01T12:00:00.123456789+1:00")).toBe(
        false,
      );
      expect(isRFC3339DateString("2022-01-01T12:00:00-05:")).toBe(false);
      expect(isRFC3339DateString("2022-01-01T12:00:00-05:00:00")).toBe(false);
      expect(isRFC3339DateString("2022-01-01")).toBe(false);
      expect(isRFC3339DateString("12:00:00Z")).toBe(false);
      expect(isRFC3339DateString("2022-01-01T12:00:00Zfoo")).toBe(false);
    });
  });

  describe("isRFC7231DateString", () => {
    it("accepts valid RFC 7231 date strings", () => {
      expect(isRFC7231DateString("Sun, 06 Nov 1994 08:49:37 GMT")).toBe(true);
      expect(isRFC7231DateString("Tue, 22 Apr 2014 07:00:00 GMT")).toBe(true);
    });

    it("rejects invalid RFC 7231 date strings", () => {
      expect(isRFC7231DateString("06 Nov 1994 08:49:37 GMT")).toBe(false);
      expect(isRFC7231DateString("Sun, 06 Nov 94 08:49:37 GMT")).toBe(false);
      expect(isRFC7231DateString("Sun, 06 Nov 1994 8:49:37 GMT")).toBe(false);
      expect(isRFC7231DateString("Sun, 06 Nov 1994 08:49:37 GMT-0500")).toBe(
        false,
      );
      expect(isRFC7231DateString("Sun, 06 November 1994 08:49:37 GMT")).toBe(
        false,
      );
      expect(isRFC7231DateString("Sunday, 06 Nov 1994 08:49:37 GMT")).toBe(
        false,
      );
      expect(isRFC7231DateString("06 Nov 1994")).toBe(false);
    });
  });

  describe("isUnixTimestamp / isTimestamp", () => {
    it("accepts unix seconds (1–10 digits)", () => {
      expect(isUnixTimestamp("1649789394")).toBe(true);
      expect(isUnixTimestamp("1234567890")).toBe(true);
      expect(isUnixTimestamp("0")).toBe(true);
      expect(isUnixTimestamp("foo")).toBe(false);
      expect(isUnixTimestamp("")).toBe(false);
    });

    it("accepts millisecond timestamps (1–13 digits)", () => {
      expect(isTimestamp("1649792026123")).toBe(true);
      expect(isTimestamp("1234567890000")).toBe(true);
      expect(isTimestamp("0")).toBe(true);
      expect(isTimestamp("foo")).toBe(false);
      expect(isTimestamp("")).toBe(false);
    });
  });

  describe("isUTCDateString", () => {
    it("matches Date#toUTCString output exactly", () => {
      expect(isUTCDateString("Sun, 06 Nov 1994 08:49:37 GMT")).toBe(true);
      expect(isUTCDateString("Tue, 22 Apr 2014 07:00:00 GMT")).toBe(true);
      expect(isUTCDateString("06 Nov 1994 08:49:37 GMT")).toBe(false);
      expect(isUTCDateString("16497920261")).toBe(false);
      expect(isUTCDateString("foo")).toBe(false);
      expect(isUTCDateString("")).toBe(false);
    });
  });

  describe("isMongoObjectId", () => {
    it("accepts 24-char hex ObjectIds", () => {
      expect(isMongoObjectId("507f1f77bcf86cd799439011")).toBe(true);
      expect(isMongoObjectId("507f1f77bcf86cd799439012")).toBe(true);
      expect(isMongoObjectId("507f1f77bcf86cd79943901")).toBe(false);
      expect(isMongoObjectId("507f1f77bcf86cd79943901z")).toBe(false);
      expect(isMongoObjectId("foo")).toBe(false);
      expect(isMongoObjectId("")).toBe(false);
    });
  });

  describe("excel format", () => {
    it("matches floating numbers including negatives", () => {
      expect(isExcelFormat("0")).toBe(true);
      expect(isExcelFormat("1")).toBe(true);
      expect(isExcelFormat("1.1")).toBe(true);
      expect(isExcelFormat("-1.1")).toBe(true);
      expect(isExcelFormat("-1")).toBe(true);
      expect(isExcelFormat("")).toBe(false);
      expect(isExcelFormat("foo")).toBe(false);
      expect(isExcelFormat("1.1.1")).toBe(false);
    });

    it("converts days since 1899-12-30", () => {
      expect(dateToExcelFormat(new Date("2016-05-20T00:00:00.000Z"))).toBe(
        "42510",
      );
      expect(dateToExcelFormat(new Date("2016-05-20T12:00:00.000Z"))).toBe(
        "42510.5",
      );
      expect(dateToExcelFormat(new Date("2023-10-31T09:26:06.421Z"))).toBe(
        "45230.39312987268",
      );
      expect(dateToExcelFormat(new Date("1970-01-01T00:00:00.000Z"))).toBe(
        "25569",
      );
      expect(dateToExcelFormat(new Date("1800-01-01T00:00:00.000Z"))).toBe(
        "-36522",
      );

      expect(excelFormatToDate("0")).toEqual(
        new Date("1899-12-30T00:00:00.000Z"),
      );
      expect(excelFormatToDate("1")).toEqual(
        new Date("1899-12-31T00:00:00.000Z"),
      );
      expect(excelFormatToDate("2")).toEqual(
        new Date("1900-01-01T00:00:00.000Z"),
      );
      expect(excelFormatToDate("4242.4242")).toEqual(
        new Date("1911-08-12T10:10:50.880Z"),
      );
      expect(excelFormatToDate("42738.22626859954")).toEqual(
        new Date("2017-01-03T05:25:49.607Z"),
      );
      expect(excelFormatToDate("-1000")).toEqual(
        new Date("1897-04-04T00:00:00.000Z"),
      );
    });
  });

  describe("formatters", () => {
    const utc = new Date("2023-10-31T09:26:06.421Z");

    it("formats RFC 7231 / unix / ms / mongo / excel in UTC-safe ways", () => {
      expect(formatRFC7231(utc)).toBe("Tue, 31 Oct 2023 09:26:06 GMT");
      expect(DATE_FORMATS[5].fromDate(utc)).toBe("1698744366");
      expect(DATE_FORMATS[6].fromDate(utc)).toBe("1698744366421");
      expect(DATE_FORMATS[8].fromDate(utc)).toBe(
        `${Math.floor(utc.getTime() / 1000).toString(16)}0000000000000000`,
      );
      expect(DATE_FORMATS[9].fromDate(utc)).toBe("45230.39312987268");
    });

    it("formatISO / ISO9075 / RFC3339 match local wall-clock algorithms", () => {
      expect(formatISO(utc)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/,
      );
      expect(formatISO9075(utc)).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
      expect(formatRFC3339(utc)).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/,
      );

      // Round-trip consistency with the same Date getters used by the formatters.
      const rebuilt = new Date(
        utc.getFullYear(),
        utc.getMonth(),
        utc.getDate(),
        utc.getHours(),
        utc.getMinutes(),
        utc.getSeconds(),
      );
      expect(formatISO(utc).slice(0, 19)).toBe(formatISO(rebuilt).slice(0, 19));
    });
  });

  describe("detect / resolve / validate", () => {
    it("defaults to Timestamp format index", () => {
      expect(DEFAULT_FORMAT_INDEX).toBe(6);
      expect(DATE_FORMATS[DEFAULT_FORMAT_INDEX].id).toBe("timestamp");
    });

    it("auto-detects format (first matcher wins)", () => {
      expect(detectFormatIndex("1698744366421")).toBe(6);
      expect(detectFormatIndex("1698744366")).toBe(5);
      expect(detectFormatIndex("2021-01-01T00:00:00.000Z")).toBe(1);
      // ISO 8601 matcher runs before ISO 9075 and also accepts space-separated forms.
      expect(detectFormatIndex("2022-01-01 12:00:00Z")).toBe(1);
      expect(detectFormatIndex("Sun, 06 Nov 1994 08:49:37 GMT")).toBe(4);
      expect(detectFormatIndex("507f1f77bcf86cd799439011")).toBe(8);
      expect(detectFormatIndex("42510.5")).toBe(9);
      expect(detectFormatIndex("not-a-date")).toBe(-1);
    });

    it("resolves empty input to fallback now", () => {
      const now = new Date("2020-01-01T00:00:00.000Z");
      expect(resolveDate("", DEFAULT_FORMAT_INDEX, now)).toBe(now);
    });

    it("resolves timestamp input", () => {
      const date = resolveDate("1698744366421", 6, new Date());
      expect(date?.toISOString()).toBe("2023-10-31T09:26:06.421Z");
    });

    it("validates empty as ok; rejects garbage for selected format", () => {
      expect(isInputValid("", 6)).toBe(true);
      expect(isInputValid("1698744366421", 6)).toBe(true);
      expect(isInputValid("not-a-date", 1)).toBe(false);
    });

    it("formatAll blanks outputs when invalid", () => {
      const blank = formatAll(undefined, false);
      expect(blank).toHaveLength(10);
      expect(blank.every((row) => row.value === "")).toBe(true);

      const filled = formatAll(new Date("1970-01-01T00:00:00.000Z"), true);
      expect(filled[5].value).toBe("0");
      expect(filled[6].value).toBe("0");
      expect(filled[9].value).toBe("25569");
    });
  });
});
