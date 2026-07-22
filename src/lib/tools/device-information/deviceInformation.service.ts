/**
 * Format device / browser environment snapshots for display.
 * Parity with it-tools device-information.
 */

export type DeviceScreenSnapshot = {
  availWidth: number;
  availHeight: number;
  orientationType?: string;
  orientationAngle?: number;
  colorDepth: number;
  devicePixelRatio: number;
  windowWidth: number;
  windowHeight: number;
};

export type DeviceNavigatorSnapshot = {
  vendor: string;
  languages: readonly string[];
  platform: string;
  userAgent: string;
};

export type DeviceEnvironmentSnapshot = {
  screen: DeviceScreenSnapshot;
  navigator: DeviceNavigatorSnapshot;
};

export type DeviceInfoItem = {
  label: string;
  /** Empty / missing values render as "unknown" in the UI. */
  value: string;
};

export type DeviceInfoSection = {
  name: string;
  information: DeviceInfoItem[];
};

const UNKNOWN = "unknown";

/** Format screen avail size like it-tools (`W x H`). */
export function formatScreenSize(availWidth: number, availHeight: number): string {
  return `${availWidth} x ${availHeight}`;
}

/** Format orientation angle with degree suffix. */
export function formatOrientationAngle(angle: number): string {
  return `${angle}°`;
}

/** Format color depth with bits unit. */
export function formatColorDepth(bits: number): string {
  return `${bits} bits`;
}

/** Format device pixel ratio with dppx unit. */
export function formatPixelRatio(ratio: number): string {
  return `${ratio} dppx`;
}

/** Format window inner size like it-tools (`W x H`). */
export function formatWindowSize(width: number, height: number): string {
  return `${width} x ${height}`;
}

/** Join navigator.languages (empty → ""). */
export function formatLanguages(languages: readonly string[]): string {
  return languages.join(", ");
}

/** Coerce empty / whitespace-only strings to the it-tools "unknown" placeholder. */
export function displayValue(value: string | undefined | null): string {
  if (value == null) return UNKNOWN;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : UNKNOWN;
}

/** Build Screen + Device sections from a pure snapshot (testable). */
export function buildDeviceInformation(
  snapshot: DeviceEnvironmentSnapshot,
): DeviceInfoSection[] {
  const { screen, navigator: nav } = snapshot;

  return [
    {
      name: "Screen",
      information: [
        {
          label: "Screen size",
          value: formatScreenSize(screen.availWidth, screen.availHeight),
        },
        {
          label: "Orientation",
          value: displayValue(screen.orientationType),
        },
        {
          label: "Orientation angle",
          value:
            screen.orientationAngle == null
              ? UNKNOWN
              : formatOrientationAngle(screen.orientationAngle),
        },
        {
          label: "Color depth",
          value: formatColorDepth(screen.colorDepth),
        },
        {
          label: "Pixel ratio",
          value: formatPixelRatio(screen.devicePixelRatio),
        },
        {
          label: "Window size",
          value: formatWindowSize(screen.windowWidth, screen.windowHeight),
        },
      ],
    },
    {
      name: "Device",
      information: [
        {
          label: "Browser vendor",
          value: displayValue(nav.vendor),
        },
        {
          label: "Languages",
          value: displayValue(formatLanguages(nav.languages)),
        },
        {
          label: "Platform",
          value: displayValue(nav.platform),
        },
        {
          label: "User agent",
          value: displayValue(nav.userAgent),
        },
      ],
    },
  ];
}

/**
 * Read the live browser environment.
 * Returns undefined when `window` is unavailable (SSR).
 */
export function readDeviceEnvironment(): DeviceEnvironmentSnapshot | undefined {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return undefined;
  }

  const orientation = window.screen.orientation;

  return {
    screen: {
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      orientationType: orientation?.type,
      orientationAngle: orientation?.angle,
      colorDepth: window.screen.colorDepth,
      devicePixelRatio: window.devicePixelRatio,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    },
    navigator: {
      vendor: navigator.vendor ?? "",
      languages: navigator.languages ? [...navigator.languages] : [],
      platform: navigator.platform ?? "",
      userAgent: navigator.userAgent ?? "",
    },
  };
}
