import { describe, expect, it } from "vitest";

import {
  buildQrPayload,
  clampQrMargin,
  clampQrSize,
  createDefaultQrContentFormState,
  getQrBackgroundColor,
  isQrContentType,
} from "./qrCodeGenerator.service";
import { buildWifiQrPayload, escapeWifiField } from "./wifiPayload.service";

describe("qrCodeGenerator.service", () => {
  it("validates content type helpers", () => {
    expect(isQrContentType("wifi")).toBe(true);
    expect(isQrContentType("nope")).toBe(false);
  });

  it("builds a text payload", () => {
    const state = createDefaultQrContentFormState({ type: "text" });
    state.text = "hello";
    const result = buildQrPayload(state);
    expect(result.isValid).toBe(true);
    expect(result.payload).toBe("hello");
  });

  it("requires website URL for website presets", () => {
    const state = createDefaultQrContentFormState({ type: "website" });
    state.websiteUrl = "";
    const result = buildQrPayload(state);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("clamps size/margin and resolves transparent background", () => {
    expect(clampQrSize(50)).toBe(128);
    expect(clampQrMargin(99)).toBe(10);
    expect(
      getQrBackgroundColor({ backgroundColor: "#ffffff", transparentBackground: true }),
    ).toBe("#ffffff00");
  });
});

describe("wifiPayload.service", () => {
  it("escapes special WiFi field characters", () => {
    expect(escapeWifiField('a;b\\c,d:"e')).toBe('a\\;b\\\\c\\,d\\:\\"e');
  });

  it("builds a WPA WiFi payload", () => {
    const result = buildWifiQrPayload({
      ssid: "Cafe",
      password: "secret",
      encryption: "WPA",
      hidden: false,
      eapAnonymousIdentity: false,
    });

    expect(result.isValid).toBe(true);
    expect(result.payload).toContain("WIFI:S:Cafe;T:WPA;P:secret;;");
  });

  it("rejects missing SSID", () => {
    const result = buildWifiQrPayload({
      ssid: "  ",
      password: "",
      encryption: "nopass",
      hidden: false,
      eapAnonymousIdentity: false,
    });

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/SSID/i);
  });
});
