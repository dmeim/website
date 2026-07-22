export type {
  GenerateUuidsOptions,
  UuidNamespacePreset,
  UuidVersion,
} from "./uuidGenerator.service";

export {
  NIL_UUID,
  UUID_NAMESPACE_DEFAULT,
  UUID_NAMESPACE_OPTIONS,
  UUID_NAMESPACE_PRESETS,
  UUID_QUANTITY_DEFAULT,
  UUID_QUANTITY_MAX,
  UUID_QUANTITY_MIN,
  UUID_VERSION_DEFAULT,
  UUID_VERSIONS,
  clampUuidQuantity,
  generateUuids,
  isValidUuid,
  isValidUuidNamespace,
  normalizeUuidVersion,
} from "./uuidGenerator.service";
