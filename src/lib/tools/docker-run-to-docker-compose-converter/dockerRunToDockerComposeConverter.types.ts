/** Message categories returned by composerize-ts (matches it-tools filtering). */
export type DockerComposeMessageKind =
  | "notImplemented"
  | "notTranslatable"
  | "errorDuringConversion";

/** Result of converting a `docker run` command into compose YAML. */
export type DockerRunConversionResult = {
  yaml: string;
  notImplemented: string[];
  notTranslatable: string[];
  errors: string[];
};
