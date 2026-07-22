import { describe, expect, it } from "vitest";

import {
  buildKeycodeFields,
  formatModifiers,
  snapshotFromKeyboardEvent,
  type KeyEventSnapshot,
} from "./keycodeInfo.service";

const SAMPLE: KeyEventSnapshot = {
  key: "a",
  keyCode: 65,
  code: "KeyA",
  location: 0,
  metaKey: false,
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
};

describe("keycode-info", () => {
  describe("formatModifiers", () => {
    it("returns empty string when no modifiers are pressed", () => {
      expect(
        formatModifiers({
          metaKey: false,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
        }),
      ).toBe("");
    });

    it("joins active modifiers in Meta → Shift → Ctrl → Alt order", () => {
      expect(
        formatModifiers({
          metaKey: true,
          shiftKey: true,
          ctrlKey: true,
          altKey: true,
        }),
      ).toBe("Meta + Shift + Ctrl + Alt");

      expect(
        formatModifiers({
          metaKey: false,
          shiftKey: true,
          ctrlKey: false,
          altKey: true,
        }),
      ).toBe("Shift + Alt");

      expect(
        formatModifiers({
          metaKey: true,
          shiftKey: false,
          ctrlKey: false,
          altKey: false,
        }),
      ).toBe("Meta");
    });
  });

  describe("buildKeycodeFields", () => {
    it("returns no fields when no event has been captured", () => {
      expect(buildKeycodeFields(null)).toEqual([]);
      expect(buildKeycodeFields(undefined)).toEqual([]);
    });

    it("builds Key / Keycode / Code / Location / Modifiers like it-tools", () => {
      const fields = buildKeycodeFields(SAMPLE);
      expect(fields.map((f) => f.id)).toEqual([
        "key",
        "keycode",
        "code",
        "location",
        "modifiers",
      ]);
      expect(fields.map((f) => f.label)).toEqual([
        "Key",
        "Keycode",
        "Code",
        "Location",
        "Modifiers",
      ]);
      expect(fields.map((f) => f.value)).toEqual([
        "a",
        "65",
        "KeyA",
        "0",
        "",
      ]);
      expect(fields.map((f) => f.placeholder)).toEqual([
        "Key name...",
        "Keycode...",
        "Code...",
        "Code...",
        "None",
      ]);
    });

    it("formats modifiers and special keys", () => {
      const fields = buildKeycodeFields({
        key: "Enter",
        keyCode: 13,
        code: "Enter",
        location: 0,
        metaKey: true,
        shiftKey: false,
        ctrlKey: true,
        altKey: false,
      });

      expect(fields.find((f) => f.id === "key")?.value).toBe("Enter");
      expect(fields.find((f) => f.id === "keycode")?.value).toBe("13");
      expect(fields.find((f) => f.id === "modifiers")?.value).toBe(
        "Meta + Ctrl",
      );
    });

    it("stringifies location for left / right / numpad keys", () => {
      expect(
        buildKeycodeFields({
          ...SAMPLE,
          key: "Shift",
          keyCode: 16,
          code: "ShiftRight",
          location: 2,
          shiftKey: true,
        }).find((f) => f.id === "location")?.value,
      ).toBe("2");
    });
  });

  describe("snapshotFromKeyboardEvent", () => {
    it("copies KeyboardEvent-like properties into a plain snapshot", () => {
      expect(
        snapshotFromKeyboardEvent({
          key: " ",
          keyCode: 32,
          code: "Space",
          location: 0,
          metaKey: false,
          shiftKey: true,
          ctrlKey: false,
          altKey: false,
        }),
      ).toEqual({
        key: " ",
        keyCode: 32,
        code: "Space",
        location: 0,
        metaKey: false,
        shiftKey: true,
        ctrlKey: false,
        altKey: false,
      });
    });
  });
});
