import { describe, expect, it } from "vitest";

import {
  chmodCommand,
  computeChmodOctalRepresentation,
  computeChmodSymbolicRepresentation,
  createEmptyPermissions,
} from "./chmodCalculator.service";

describe("chmod-calculator", () => {
  describe("computeChmodOctalRepresentation", () => {
    it("get the octal representation from permissions", () => {
      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: true, write: true, execute: true },
            group: { read: true, write: true, execute: true },
            public: { read: true, write: true, execute: true },
          },
        }),
      ).toEqual("777");

      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: false, write: false, execute: false },
            group: { read: false, write: false, execute: false },
            public: { read: false, write: false, execute: false },
          },
        }),
      ).toEqual("000");

      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: false, write: true, execute: false },
            group: { read: false, write: true, execute: true },
            public: { read: true, write: false, execute: true },
          },
        }),
      ).toEqual("235");

      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: true, write: false, execute: false },
            group: { read: false, write: true, execute: false },
            public: { read: false, write: false, execute: true },
          },
        }),
      ).toEqual("421");

      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: false, write: false, execute: true },
            group: { read: false, write: true, execute: false },
            public: { read: true, write: false, execute: false },
          },
        }),
      ).toEqual("124");

      expect(
        computeChmodOctalRepresentation({
          permissions: {
            owner: { read: false, write: true, execute: false },
            group: { read: false, write: true, execute: false },
            public: { read: false, write: true, execute: false },
          },
        }),
      ).toEqual("222");
    });
  });

  describe("computeChmodSymbolicRepresentation", () => {
    it("get the symbolic representation from permissions", () => {
      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: true, write: true, execute: true },
            group: { read: true, write: true, execute: true },
            public: { read: true, write: true, execute: true },
          },
        }),
      ).toEqual("rwxrwxrwx");

      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: false, write: false, execute: false },
            group: { read: false, write: false, execute: false },
            public: { read: false, write: false, execute: false },
          },
        }),
      ).toEqual("---------");

      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: false, write: true, execute: false },
            group: { read: false, write: true, execute: true },
            public: { read: true, write: false, execute: true },
          },
        }),
      ).toEqual("-w--wxr-x");

      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: true, write: false, execute: false },
            group: { read: false, write: true, execute: false },
            public: { read: false, write: false, execute: true },
          },
        }),
      ).toEqual("r---w---x");

      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: false, write: false, execute: true },
            group: { read: false, write: true, execute: false },
            public: { read: true, write: false, execute: false },
          },
        }),
      ).toEqual("--x-w-r--");

      expect(
        computeChmodSymbolicRepresentation({
          permissions: {
            owner: { read: false, write: true, execute: false },
            group: { read: false, write: true, execute: false },
            public: { read: false, write: true, execute: false },
          },
        }),
      ).toEqual("-w--w--w-");
    });
  });

  describe("chmodCommand", () => {
    it("builds a chmod command with the octal mode and path", () => {
      expect(chmodCommand("755")).toBe("chmod 755 path");
      expect(chmodCommand("644", "/var/www")).toBe("chmod 644 /var/www");
    });
  });

  describe("createEmptyPermissions", () => {
    it("returns all-false owner/group/public scopes", () => {
      expect(createEmptyPermissions()).toEqual({
        owner: { read: false, write: false, execute: false },
        group: { read: false, write: false, execute: false },
        public: { read: false, write: false, execute: false },
      });
      expect(
        computeChmodOctalRepresentation({ permissions: createEmptyPermissions() }),
      ).toBe("000");
    });
  });
});
