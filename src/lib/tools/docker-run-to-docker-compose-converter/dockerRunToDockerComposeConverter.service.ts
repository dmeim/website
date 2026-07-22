/**
 * Convert `docker run` / `docker create` commands to docker-compose YAML.
 * Parity with it-tools: wraps `composerize-ts` and surfaces message categories.
 */
import { MessageType, composerize } from "composerize-ts";

import type { DockerRunConversionResult } from "./dockerRunToDockerComposeConverter.types";

export type {
  DockerComposeMessageKind,
  DockerRunConversionResult,
} from "./dockerRunToDockerComposeConverter.types";

/** Sample command shown on first load — matches it-tools default. */
export const DEFAULT_DOCKER_RUN =
  "docker run -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --restart always --log-opt max-size=1g nginx";

const EMPTY_RESULT: DockerRunConversionResult = {
  yaml: "",
  notImplemented: [],
  notTranslatable: [],
  errors: [],
};

function withDefaultOnError<T>(cb: () => T, defaultValue: T): T {
  try {
    return cb();
  } catch {
    return defaultValue;
  }
}

/**
 * Convert a docker run/create command into compose YAML plus advisory messages.
 * Trims input; on throw returns empty YAML and no messages (it-tools parity).
 */
export function convertDockerRunToCompose(
  command: string,
): DockerRunConversionResult {
  return withDefaultOnError(() => {
    const result = composerize(command.trim());
    const messages = result.messages ?? [];

    return {
      yaml: result.yaml ?? "",
      notImplemented: messages
        .filter((msg) => msg.type === MessageType.notImplemented)
        .map((msg) => msg.value),
      notTranslatable: messages
        .filter((msg) => msg.type === MessageType.notTranslatable)
        .map((msg) => msg.value),
      errors: messages
        .filter((msg) => msg.type === MessageType.errorDuringConversion)
        .map((msg) => msg.value),
    };
  }, EMPTY_RESULT);
}
