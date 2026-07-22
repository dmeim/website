import {
  NIL as nilUuid,
  v1 as generateUuidV1,
  v3 as generateUuidV3,
  v4 as generateUuidV4,
  v5 as generateUuidV5,
  validate as validateUuidLib,
} from "uuid";

export const UUID_VERSIONS = ["NIL", "v1", "v3", "v4", "v5"] as const;
export type UuidVersion = (typeof UUID_VERSIONS)[number];

export const UUID_VERSION_DEFAULT: UuidVersion = "v4";

export const UUID_QUANTITY_MIN = 1;
export const UUID_QUANTITY_MAX = 50;
export const UUID_QUANTITY_DEFAULT = 1;

/** RFC 4122 namespace UUIDs (same values as it-tools / uuid package presets). */
export const UUID_NAMESPACE_PRESETS = {
  DNS: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  URL: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
  OID: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
  X500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
} as const;

export type UuidNamespacePreset = keyof typeof UUID_NAMESPACE_PRESETS;

export const UUID_NAMESPACE_DEFAULT = UUID_NAMESPACE_PRESETS.URL;

export const UUID_NAMESPACE_OPTIONS = (
  Object.keys(UUID_NAMESPACE_PRESETS) as UuidNamespacePreset[]
).map((key) => ({
  key,
  label: key,
  value: UUID_NAMESPACE_PRESETS[key],
}));

export interface GenerateUuidsOptions {
  version?: UuidVersion;
  quantity?: number;
  /** Namespace UUID for v3 / v5. */
  namespace?: string;
  /** Name string for v3 / v5. */
  name?: string;
}

export function clampUuidQuantity(value: unknown, fallback = UUID_QUANTITY_DEFAULT): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(UUID_QUANTITY_MAX, Math.max(UUID_QUANTITY_MIN, Math.trunc(parsed)));
}

export function normalizeUuidVersion(value: unknown, fallback: UuidVersion = UUID_VERSION_DEFAULT): UuidVersion {
  if (typeof value === "string" && (UUID_VERSIONS as readonly string[]).includes(value)) {
    return value as UuidVersion;
  }

  return fallback;
}

/**
 * Accepts NIL or a version 1–5 UUID string (case-insensitive), matching it-tools validation.
 */
export function isValidUuidNamespace(value: string): boolean {
  const trimmed = value.trim();

  if (!trimmed) {
    return false;
  }

  if (trimmed === nilUuid) {
    return true;
  }

  return Boolean(
    trimmed.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
  );
}

export function isValidUuid(value: string): boolean {
  return validateUuidLib(value.trim());
}

function generateOne(version: UuidVersion, index: number, namespace: string, name: string): string {
  switch (version) {
    case "NIL":
      return nilUuid;
    case "v1":
      return generateUuidV1({
        clockseq: index,
        msecs: Date.now(),
        nsecs: Math.floor(Math.random() * 10000),
        node: Array.from({ length: 6 }, () => Math.floor(Math.random() * 256)),
      });
    case "v3":
      return generateUuidV3(name, namespace);
    case "v4":
      return generateUuidV4();
    case "v5":
      return generateUuidV5(name, namespace);
    default: {
      const _exhaustive: never = version;
      return _exhaustive;
    }
  }
}

/**
 * Generate one or more UUIDs as a newline-joined string.
 * Errors (e.g. invalid v3/v5 namespace) yield an empty string — matches it-tools `withDefaultOnError`.
 */
export function generateUuids({
  version = UUID_VERSION_DEFAULT,
  quantity = UUID_QUANTITY_DEFAULT,
  namespace = UUID_NAMESPACE_DEFAULT,
  name = "",
}: GenerateUuidsOptions = {}): string {
  const safeVersion = normalizeUuidVersion(version);
  const count = clampUuidQuantity(quantity);

  try {
    return Array.from({ length: count }, (_ignored, index) =>
      generateOne(safeVersion, index, namespace, name),
    ).join("\n");
  } catch {
    return "";
  }
}

export { nilUuid as NIL_UUID };
