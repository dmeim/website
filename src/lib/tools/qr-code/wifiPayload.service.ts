export const WIFI_ENCRYPTIONS = ["nopass", "WPA", "WEP", "WPA2-EAP"] as const;
export type WifiEncryption = (typeof WIFI_ENCRYPTIONS)[number];

export const EAP_METHODS = [
  "MD5",
  "POTP",
  "GTC",
  "TLS",
  "IKEv2",
  "SIM",
  "AKA",
  "AKA'",
  "TTLS",
  "PWD",
  "LEAP",
  "PSK",
  "FAST",
  "TEAP",
  "EKE",
  "NOOB",
  "PEAP",
] as const;
export type EapMethod = (typeof EAP_METHODS)[number];

export const EAP_PHASE_2_METHODS = ["None", "MSCHAPV2", "GTC", "PAP"] as const;
export type EapPhase2Method = (typeof EAP_PHASE_2_METHODS)[number];

export interface WifiQrCodeInput {
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
  eapMethod?: EapMethod;
  eapPhase2Method?: EapPhase2Method;
  eapIdentity?: string;
  eapAnonymousIdentity: boolean;
}

export interface WifiQrPayloadResult {
  payload: string;
  errors: string[];
  isValid: boolean;
}

export function escapeWifiField(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

export function buildWifiQrPayload(input: WifiQrCodeInput): WifiQrPayloadResult {
  // Spaces can be part of a real network name, so only validate on the trimmed value.
  const ssid = input.ssid;
  const password = input.password;
  const errors: string[] = [];

  if (!ssid.trim()) {
    errors.push("SSID is required.");
  }

  if (input.encryption !== "nopass" && !password) {
    errors.push("Password is required for the selected encryption method.");
  }

  if (input.encryption === "WPA2-EAP") {
    if (!input.eapMethod) {
      errors.push("EAP method is required for WPA2-EAP.");
    }

    if (!input.eapAnonymousIdentity && !input.eapIdentity?.trim()) {
      errors.push("EAP identity is required unless anonymous identity is enabled.");
    }

    if (input.eapMethod === "PEAP" && !input.eapPhase2Method) {
      errors.push("Phase 2 method is required for PEAP.");
    }
  }

  if (errors.length) {
    return { payload: "", errors, isValid: false };
  }

  const fields = [`S:${escapeWifiField(ssid)}`];

  if (input.encryption !== "nopass") {
    fields.push(`T:${input.encryption}`);
    fields.push(`P:${escapeWifiField(password)}`);
  }

  if (input.encryption === "WPA2-EAP") {
    fields.push(`E:${input.eapMethod}`);

    if (input.eapPhase2Method && input.eapPhase2Method !== "None") {
      fields.push(`PH2:${input.eapPhase2Method}`);
    }

    fields.push(
      input.eapAnonymousIdentity
        ? "A:anon"
        : `I:${escapeWifiField(input.eapIdentity?.trim() ?? "")}`,
    );
  }

  if (input.hidden) {
    fields.push("H:true");
  }

  return {
    payload: `WIFI:${fields.join(";")};;`,
    errors: [],
    isValid: true,
  };
}
