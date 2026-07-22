/**
 * Parse a user-agent string into browser / engine / OS / device / CPU parts.
 * Parity with it-tools user-agent-parser (ua-parser-js).
 */

import { UAParser } from "ua-parser-js";

export type UserAgentNameVersion = {
  name?: string;
  version?: string;
};

export type UserAgentDevice = {
  model?: string;
  type?: string;
  vendor?: string;
};

export type UserAgentCpu = {
  architecture?: string;
};

export type ParsedUserAgent = {
  ua: string;
  browser: UserAgentNameVersion;
  engine: UserAgentNameVersion;
  os: UserAgentNameVersion;
  device: UserAgentDevice;
  cpu: UserAgentCpu;
};

export type UserAgentField = {
  label: string;
  value: string | undefined;
  fallback: string;
};

export type UserAgentSection = {
  heading: string;
  fields: UserAgentField[];
};

const EMPTY_RESULT: ParsedUserAgent = {
  ua: "",
  browser: {},
  engine: {},
  os: {},
  device: {},
  cpu: {},
};

/**
 * Parse a UA string. Empty / whitespace-only input returns empty sections
 * (it-tools avoids falling back to the current browser UA).
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  const trimmed = userAgent.trim();
  if (trimmed.length === 0) {
    return { ...EMPTY_RESULT };
  }

  const result = UAParser(trimmed);
  return {
    ua: result.ua,
    browser: {
      name: result.browser.name,
      version: result.browser.version,
    },
    engine: {
      name: result.engine.name,
      version: result.engine.version,
    },
    os: {
      name: result.os.name,
      version: result.os.version,
    },
    device: {
      model: result.device.model,
      type: result.device.type,
      vendor: result.device.vendor,
    },
    cpu: {
      architecture: result.cpu.architecture,
    },
  };
}

/** Build labeled result sections matching it-tools card layout. */
export function buildUserAgentSections(
  info: ParsedUserAgent,
): UserAgentSection[] {
  return [
    {
      heading: "Browser",
      fields: [
        {
          label: "Name",
          value: info.browser.name,
          fallback: "No browser name available",
        },
        {
          label: "Version",
          value: info.browser.version,
          fallback: "No browser version available",
        },
      ],
    },
    {
      heading: "Engine",
      fields: [
        {
          label: "Name",
          value: info.engine.name,
          fallback: "No engine name available",
        },
        {
          label: "Version",
          value: info.engine.version,
          fallback: "No engine version available",
        },
      ],
    },
    {
      heading: "OS",
      fields: [
        {
          label: "Name",
          value: info.os.name,
          fallback: "No OS name available",
        },
        {
          label: "Version",
          value: info.os.version,
          fallback: "No OS version available",
        },
      ],
    },
    {
      heading: "Device",
      fields: [
        {
          label: "Model",
          value: info.device.model,
          fallback: "No device model available",
        },
        {
          label: "Type",
          value: info.device.type,
          fallback: "No device type available",
        },
        {
          label: "Vendor",
          value: info.device.vendor,
          fallback: "No device vendor available",
        },
      ],
    },
    {
      heading: "CPU",
      fields: [
        {
          label: "Architecture",
          value: info.cpu.architecture,
          fallback: "No CPU architecture available",
        },
      ],
    },
  ];
}
