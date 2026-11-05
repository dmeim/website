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

const NOT_DOCKER_RUN = "Enter a command that starts with docker run or docker create.";
const UNCLOSED_QUOTE = "This command has an unclosed quote. Close it and try again.";
const NO_IMAGE = "No image name found. Put it after the options, like docker run -p 80:80 nginx.";
const CONVERSION_FAILED = "This command could not be converted. Check its options and quoting.";

function errorResult(message: string): DockerRunConversionResult {
  return { ...EMPTY_RESULT, errors: [message] };
}

/** Split a command the way a shell would, resolving quotes and line continuations. Null on an unclosed quote. */
function tokenizeCommand(command: string): string[] | null {
  const tokens: string[] = [];
  let token: string | null = null;
  let quote: string | null = null;

  for (let index = 0; index < command.length; index += 1) {
    const char = command[index]!;
    const next = command[index + 1];

    if (quote === "'") {
      if (char === "'") quote = null;
      else token += char;
    } else if (char === "\\" && next !== undefined && (!quote || '"\\$`\n'.includes(next))) {
      index += 1;
      if (next !== "\n") token = (token ?? "") + next;
    } else if (quote === '"') {
      if (char === '"') quote = null;
      else token += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      token ??= "";
    } else if (/\s/.test(char)) {
      if (token !== null) tokens.push(token);
      token = null;
    } else {
      token = (token ?? "") + char;
    }
  }

  if (quote) return null;
  if (token !== null) tokens.push(token);
  return tokens;
}

/** The parser only understands a whole argument in quotes, and only without quotes nested inside it. */
function quoteToken(token: string): string {
  if (token !== "" && !/[\s"']/.test(token)) return token;
  return token.includes('"') ? `'${token}'` : `"${token}"`;
}

/**
 * Rewrites what people actually paste (`sudo`, `docker container run`, extra spaces, `-e A="b"`) to the plain
 * form the parser expects. The parser reads anything else as an image name, like `image: sudo`, so reject it.
 */
function toParserCommand(tokens: string[]): string | null {
  const args = tokens[0] === "$" ? tokens.slice(1) : tokens;
  const start = args[0] === "sudo" ? 1 : 0;
  if (args[start] !== "docker") return null;

  const verbIndex = args[start + 1] === "container" ? start + 2 : start + 1;
  const verb = args[verbIndex];
  if (verb !== "run" && verb !== "create") return null;

  return ["docker", verb, ...args.slice(verbIndex + 1).map(quoteToken)].join(" ");
}

/**
 * Convert a docker run/create command into compose YAML plus advisory messages.
 * Blank input is the empty state. Input that is not a convertible command returns empty YAML and an error.
 */
export function convertDockerRunToCompose(
  command: string,
): DockerRunConversionResult {
  if (command.trim() === "") return EMPTY_RESULT;

  const tokens = tokenizeCommand(command.trim().replace(/\r\n/g, "\n"));
  if (!tokens) return errorResult(UNCLOSED_QUOTE);

  const parserCommand = toParserCommand(tokens);
  if (!parserCommand) return errorResult(NOT_DOCKER_RUN);

  try {
    const result = composerize(parserCommand);
    const messages = result.messages ?? [];
    const errors = messages
      .filter((msg) => msg.type === MessageType.errorDuringConversion)
      .map((msg) => msg.value);

    if (/^services:\n\s+"":/m.test(result.yaml ?? "")) {
      return { ...EMPTY_RESULT, errors: [...errors, NO_IMAGE] };
    }

    return {
      yaml: result.yaml ?? "",
      notImplemented: messages
        .filter((msg) => msg.type === MessageType.notImplemented)
        .map((msg) => msg.value),
      notTranslatable: messages
        .filter((msg) => msg.type === MessageType.notTranslatable)
        .map((msg) => msg.value),
      errors,
    };
  } catch {
    return errorResult(CONVERSION_FAILED);
  }
}
