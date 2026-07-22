/**
 * Parse a URL into constituent parts via the native URL API.
 * Parity with it-tools url-parser.
 */

export const DEFAULT_URL =
  "https://me:pwd@it-tools.tech:3000/url-parser?key1=value&key2=value2#the-hash";

export type UrlPropertyKey =
  | "protocol"
  | "username"
  | "password"
  | "hostname"
  | "port"
  | "pathname"
  | "search";

export type UrlProperty = {
  title: string;
  key: UrlPropertyKey;
  value: string;
};

export type UrlSearchParam = {
  key: string;
  value: string;
};

export type ParsedUrl = {
  protocol: string;
  username: string;
  password: string;
  hostname: string;
  port: string;
  pathname: string;
  search: string;
  hash: string;
  href: string;
  origin: string;
  properties: UrlProperty[];
  /** Deduped by key (last value wins), matching it-tools Object.fromEntries. */
  searchParams: UrlSearchParam[];
};

const PROPERTY_DEFS: { title: string; key: UrlPropertyKey }[] = [
  { title: "Protocol", key: "protocol" },
  { title: "Username", key: "username" },
  { title: "Password", key: "password" },
  { title: "Hostname", key: "hostname" },
  { title: "Port", key: "port" },
  { title: "Path", key: "pathname" },
  { title: "Params", key: "search" },
];

/** True when `new URL(value)` succeeds. */
export function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Parse a URL string; returns undefined when invalid. */
export function parseUrl(value: string): ParsedUrl | undefined {
  try {
    const url = new URL(value);
    const searchParams = Object.entries(
      Object.fromEntries(url.searchParams.entries()),
    ).map(([key, paramValue]) => ({ key, value: paramValue }));

    const parts = {
      protocol: url.protocol,
      username: url.username,
      password: url.password,
      hostname: url.hostname,
      port: url.port,
      pathname: url.pathname,
      search: url.search,
      hash: url.hash,
      href: url.href,
      origin: url.origin,
    };

    return {
      ...parts,
      properties: PROPERTY_DEFS.map(({ title, key }) => ({
        title,
        key,
        value: parts[key],
      })),
      searchParams,
    };
  } catch {
    return undefined;
  }
}
