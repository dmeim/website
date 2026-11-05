import { describe, expect, it } from "vitest";

import {
  buildQrPayload,
  clampQrMargin,
  clampQrSize,
  createDefaultQrContentFormState,
  describeQrRenderError,
  getQrBackgroundColor,
  getQrExportBaseNameForContent,
  isQrContentType,
} from "./qrCodeGenerator.service";
import { EAP_METHODS, EAP_PHASE_2_METHODS, buildWifiQrPayload, escapeWifiField } from "./wifiPayload.service";

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

describe("qrCodeGenerator.service presets", () => {
  const payloadFor = (overrides: Parameters<typeof createDefaultQrContentFormState>[0]) =>
    buildQrPayload(createDefaultQrContentFormState(overrides));

  it("percent-encodes email fields so spaces do not become plus signs", () => {
    expect(
      payloadFor({ type: "email", emailTo: "a@b.co", emailSubject: "Hello there", emailBody: "x+y & z" }).payload,
    ).toBe("mailto:a@b.co?subject=Hello%20there&body=x%2By%20%26%20z");
    expect(payloadFor({ type: "email", emailTo: "a@b.co" }).payload).toBe("mailto:a@b.co");
  });

  it("rejects phone numbers with no digits", () => {
    expect(payloadFor({ type: "phone", phoneNumber: "abc" }).isValid).toBe(false);
    expect(payloadFor({ type: "phone", phoneNumber: "+1 (555) 0100" }).payload).toBe("tel:+15550100");
  });

  it("validates coordinates", () => {
    expect(payloadFor({ type: "location", latitude: "40.7128", longitude: "-74.0060" }).payload).toBe(
      "geo:40.7128,-74.0060",
    );
    expect(payloadFor({ type: "location", latitude: "abc", longitude: "1" }).errors[0]).toMatch(/Latitude/);
    expect(payloadFor({ type: "location", latitude: "91", longitude: "1" }).isValid).toBe(false);
    expect(payloadFor({ type: "location", latitude: "1", longitude: "181" }).errors[0]).toMatch(/Longitude/);
  });

  it("never puts a WiFi password in the download file name", () => {
    const content = createDefaultQrContentFormState({ type: "wifi", wifiSsid: "Cafe", wifiPassword: "hunter2" });
    const name = getQrExportBaseNameForContent(content, buildQrPayload(content).payload);
    expect(name).toBe("qr-code-wifi-cafe");
  });

  it("names public presets from their payload and private ones from their type", () => {
    const text = createDefaultQrContentFormState({ type: "text", text: "https://example.com" });
    expect(getQrExportBaseNameForContent(text, "https://example.com")).toBe("qr-code-example-com");
    const contact = createDefaultQrContentFormState({ type: "contact", contactFirstName: "Ada" });
    expect(getQrExportBaseNameForContent(contact, "BEGIN:VCARD")).toBe("qr-code-contact");
  });

  it("explains oversized content in plain language", () => {
    expect(describeQrRenderError(new Error("The amount of data is too big to be stored in a QR Code"))).toMatch(
      /too long/,
    );
    expect(describeQrRenderError(new Error("Invalid hex color: x"))).toMatch(/Could not render/);
  });
});

describe("wifiPayload.service", () => {
  const eap = {
    ssid: "Corp",
    password: "pw",
    encryption: "WPA2-EAP",
    hidden: false,
    eapMethod: "PEAP",
    eapPhase2Method: "MSCHAPV2",
    eapIdentity: "alice",
    eapAnonymousIdentity: false,
  } as const;

  it("offers every it-tools EAP and phase 2 method", () => {
    expect([...EAP_METHODS].sort()).toEqual(
      ["MD5", "POTP", "GTC", "TLS", "IKEv2", "SIM", "AKA", "AKA'", "TTLS", "PWD", "LEAP", "PSK", "FAST", "TEAP", "EKE", "NOOB", "PEAP"].sort(),
    );
    expect(EAP_PHASE_2_METHODS).toEqual(expect.arrayContaining(["None", "MSCHAPV2"]));
  });

  it("builds WPA2-EAP payloads in it-tools field order", () => {
    expect(buildWifiQrPayload(eap).payload).toBe("WIFI:S:Corp;T:WPA2-EAP;P:pw;E:PEAP;PH2:MSCHAPV2;I:alice;;");
    expect(buildWifiQrPayload({ ...eap, eapPhase2Method: "None" }).payload).toBe(
      "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:PEAP;I:alice;;",
    );
    expect(buildWifiQrPayload({ ...eap, eapAnonymousIdentity: true }).payload).toBe(
      "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:PEAP;PH2:MSCHAPV2;A:anon;;",
    );
    expect(buildWifiQrPayload({ ...eap, hidden: true }).payload).toBe(
      "WIFI:S:Corp;T:WPA2-EAP;P:pw;E:PEAP;PH2:MSCHAPV2;I:alice;H:true;;",
    );
  });

  it("requires an identity unless anonymous", () => {
    const result = buildWifiQrPayload({ ...eap, eapIdentity: "" });
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toMatch(/identity/i);
  });

  it("covers WEP, open, and hidden networks", () => {
    const base = { ssid: "Cafe", password: "pw", hidden: false, eapAnonymousIdentity: false };
    expect(buildWifiQrPayload({ ...base, encryption: "WEP" }).payload).toBe("WIFI:S:Cafe;T:WEP;P:pw;;");
    expect(buildWifiQrPayload({ ...base, encryption: "nopass" }).payload).toBe("WIFI:S:Cafe;;");
    expect(buildWifiQrPayload({ ...base, encryption: "nopass", hidden: true }).payload).toBe("WIFI:S:Cafe;H:true;;");
    expect(buildWifiQrPayload({ ...base, encryption: "WPA", hidden: true }).payload).toBe(
      "WIFI:S:Cafe;T:WPA;P:pw;H:true;;",
    );
  });

  it("escapes special characters and keeps spaces in the network name", () => {
    expect(
      buildWifiQrPayload({ ssid: ' a;b:"c', password: "p,w\\", encryption: "WPA", hidden: false, eapAnonymousIdentity: false })
        .payload,
    ).toBe('WIFI:S: a\\;b\\:\\"c;T:WPA;P:p\\,w\\\\;;');
  });

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
