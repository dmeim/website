import { describe, expect, it } from "vitest";

import {
  areInputsValid,
  calculateCidr,
  getResultRows,
} from "./ipv4RangeExpander.service";

describe("ipv4-range-expander", () => {
  describe("calculateCidr", () => {
    it("calculates a valid CIDR for a typical private range", () => {
      const result = calculateCidr({
        startIp: "192.168.1.1",
        endIp: "192.168.7.255",
      });

      expect(result).toBeDefined();
      expect(result?.oldSize).toEqual(1791);
      expect(result?.newSize).toEqual(2048);
      expect(result?.newStart).toEqual("192.168.0.0");
      expect(result?.newEnd).toEqual("192.168.7.255");
      expect(result?.newCidr).toEqual("192.168.0.0/21");
    });

    it("calculates a valid CIDR when the first octet is below 128", () => {
      const result = calculateCidr({
        startIp: "10.0.0.1",
        endIp: "10.0.0.17",
      });

      expect(result).toBeDefined();
      expect(result?.oldSize).toEqual(17);
      expect(result?.newSize).toEqual(32);
      expect(result?.newStart).toEqual("10.0.0.0");
      expect(result?.newEnd).toEqual("10.0.0.31");
      expect(result?.newCidr).toEqual("10.0.0.0/27");
    });

    it("returns undefined when end is lower than start", () => {
      expect(
        calculateCidr({ startIp: "192.168.7.1", endIp: "192.168.6.255" }),
      ).not.toBeDefined();
    });

    it("covers the default UI start/end pair", () => {
      const result = calculateCidr({
        startIp: "192.168.1.1",
        endIp: "192.168.6.255",
      });

      expect(result).toBeDefined();
      expect(result?.newCidr).toEqual("192.168.0.0/21");
      expect(result?.newStart).toEqual("192.168.0.0");
      expect(result?.newEnd).toEqual("192.168.7.255");
    });
  });

  describe("areInputsValid", () => {
    it("accepts two valid addresses", () => {
      expect(areInputsValid("192.168.1.1", "192.168.6.255")).toBe(true);
    });

    it("rejects invalid addresses", () => {
      expect(areInputsValid("not-an-ip", "192.168.6.255")).toBe(false);
      expect(areInputsValid("192.168.1.1", "999.0.0.1")).toBe(false);
    });
  });

  describe("getResultRows", () => {
    it("returns labeled old/new rows for a valid expansion", () => {
      const result = calculateCidr({
        startIp: "10.0.0.1",
        endIp: "10.0.0.17",
      });
      const rows = getResultRows("10.0.0.1", "10.0.0.17", result);

      expect(rows).toHaveLength(4);
      expect(rows[0]).toMatchObject({
        key: "start-address",
        oldValue: "10.0.0.1",
        newValue: "10.0.0.0",
      });
      expect(rows[3]).toMatchObject({
        key: "cidr",
        oldValue: "",
        newValue: "10.0.0.0/27",
      });
    });

    it("returns empty rows when the range is inverted", () => {
      expect(
        getResultRows(
          "192.168.7.1",
          "192.168.6.255",
          calculateCidr({ startIp: "192.168.7.1", endIp: "192.168.6.255" }),
        ),
      ).toEqual([]);
    });
  });

  describe("covering CIDR (vectors from python ipaddress)", () => {
    const vectors: [string, string, number, string, string, string, number][] = [
      ["192.168.1.1", "192.168.6.255", 1535, "192.168.0.0/21", "192.168.0.0", "192.168.7.255", 2048],
      ["0.0.0.0", "255.255.255.255", 4294967296, "0.0.0.0/0", "0.0.0.0", "255.255.255.255", 4294967296],
      ["127.255.255.255", "128.0.0.0", 2, "0.0.0.0/0", "0.0.0.0", "255.255.255.255", 4294967296],
      ["10.0.0.5", "10.0.0.5", 1, "10.0.0.5/32", "10.0.0.5", "10.0.0.5", 1],
      ["255.255.255.255", "255.255.255.255", 1, "255.255.255.255/32", "255.255.255.255", "255.255.255.255", 1],
      ["0.0.0.0", "0.0.0.0", 1, "0.0.0.0/32", "0.0.0.0", "0.0.0.0", 1],
      ["172.16.3.200", "172.16.4.1", 58, "172.16.0.0/21", "172.16.0.0", "172.16.7.255", 2048],
      ["255.255.255.0", "255.255.255.255", 256, "255.255.255.0/24", "255.255.255.0", "255.255.255.255", 256],
      ["1.2.3.4", "1.2.3.5", 2, "1.2.3.4/31", "1.2.3.4", "1.2.3.5", 2],
      ["203.0.113.7", "203.0.113.200", 194, "203.0.113.0/24", "203.0.113.0", "203.0.113.255", 256],
      ["64.0.0.0", "95.255.255.255", 536870912, "64.0.0.0/3", "64.0.0.0", "95.255.255.255", 536870912],
      ["224.0.0.1", "239.255.255.255", 268435455, "224.0.0.0/4", "224.0.0.0", "239.255.255.255", 268435456],
    ];

    it.each(vectors)("%s to %s", (startIp, endIp, oldSize, newCidr, newStart, newEnd, newSize) => {
      expect(calculateCidr({ startIp, endIp })).toEqual({ oldSize, newCidr, newStart, newEnd, newSize });
    });

    it("trims the addresses shown in the old value column", () => {
      const startIp = " 10.0.0.1 ";
      const rows = getResultRows(startIp, "10.0.0.17", calculateCidr({ startIp, endIp: "10.0.0.17" }));
      expect(rows[0]?.oldValue).toBe("10.0.0.1");
    });
  });
});
