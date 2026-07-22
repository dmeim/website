import { describe, expect, it } from "vitest";

import {
  DEFAULT_DOCKER_RUN,
  convertDockerRunToCompose,
} from "./dockerRunToDockerComposeConverter.service";

describe("docker-run-to-docker-compose-converter", () => {
  describe("convertDockerRunToCompose", () => {
    it("converts the it-tools default docker run sample", () => {
      const result = convertDockerRunToCompose(DEFAULT_DOCKER_RUN);

      expect(result.yaml).toContain("version: '3.9'");
      expect(result.yaml).toContain("image: nginx");
      expect(result.yaml).toContain("restart: always");
      expect(result.yaml).toContain("'80:80'");
      expect(result.yaml).toContain(
        "'/var/run/docker.sock:/tmp/docker.sock:ro'",
      );
      expect(result.yaml).toContain("max-size: 1g");
      expect(result.notImplemented).toEqual([]);
      expect(result.notTranslatable).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("trims surrounding whitespace before converting", () => {
      const padded = `  ${DEFAULT_DOCKER_RUN}  \n`;
      expect(convertDockerRunToCompose(padded).yaml).toBe(
        convertDockerRunToCompose(DEFAULT_DOCKER_RUN).yaml,
      );
    });

    it("reports options that cannot be translated to compose", () => {
      const result = convertDockerRunToCompose(
        "docker run --rm -p 80:80 nginx",
      );

      expect(result.yaml).toContain("image: nginx");
      expect(result.yaml).toContain("'80:80'");
      expect(result.notTranslatable).toEqual([
        'The option "--rm" could not be translated to docker-compose.yml.',
      ]);
      expect(result.notImplemented).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("reports options that are not yet implemented", () => {
      const result = convertDockerRunToCompose("docker run --gpus all nginx");

      expect(result.yaml).toContain("image: nginx");
      expect(result.notImplemented).toEqual([
        'The option "--gpus" is not yet implemented.',
      ]);
      expect(result.notTranslatable).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("still returns a compose shell for empty input", () => {
      const result = convertDockerRunToCompose("");
      expect(result.yaml).toContain("version: '3.9'");
      expect(result.yaml).toContain("services:");
      expect(result.notImplemented).toEqual([]);
      expect(result.notTranslatable).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("handles whitespace-only input like empty after trim", () => {
      const result = convertDockerRunToCompose("   \n\t  ");
      expect(result.yaml).toBe(convertDockerRunToCompose("").yaml);
    });
  });

  describe("DEFAULT_DOCKER_RUN", () => {
    it("matches the it-tools sample command", () => {
      expect(DEFAULT_DOCKER_RUN).toBe(
        "docker run -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --restart always --log-opt max-size=1g nginx",
      );
    });
  });
});
