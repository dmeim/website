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

    it("returns nothing for empty input", () => {
      const result = convertDockerRunToCompose("");
      expect(result.yaml).toBe("");
      expect(result.notImplemented).toEqual([]);
      expect(result.notTranslatable).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it("handles whitespace-only input like empty after trim", () => {
      expect(convertDockerRunToCompose("   \n\t  ")).toEqual(convertDockerRunToCompose(""));
    });

    it("rejects commands that are not docker run or docker create", () => {
      for (const command of ["ls -la", "docker ps", "docker", "podman run nginx"]) {
        const result = convertDockerRunToCompose(command);
        expect(result.yaml, command).toBe("");
        expect(result.errors, command).toEqual(["Enter a command that starts with docker run or docker create."]);
      }
    });

    it("reports a missing image instead of an unnamed service", () => {
      for (const command of ["docker run", "docker run -p nginx"]) {
        const result = convertDockerRunToCompose(command);
        expect(result.yaml, command).toBe("");
        expect(result.errors.join(), command).toContain("No image name found");
      }
    });

    it("reports an unclosed quote", () => {
      const result = convertDockerRunToCompose('docker run -e "A=b nginx');
      expect(result.yaml).toBe("");
      expect(result.errors).toEqual(["This command has an unclosed quote. Close it and try again."]);
    });

    it("accepts the forms people paste", () => {
      const expected = convertDockerRunToCompose("docker run nginx").yaml;
      expect(expected).toContain("image: nginx");
      for (const command of [
        "sudo docker run nginx",
        "$ docker run nginx",
        "docker   run   nginx",
        "docker container run nginx",
        "docker run \\\n  nginx",
        "docker run \\\r\n  nginx",
      ]) {
        expect(convertDockerRunToCompose(command).yaml, command).toBe(expected);
      }
      expect(convertDockerRunToCompose("docker create nginx").yaml).toBe(expected);
    });

    it("keeps quoted values with their option", () => {
      const result = convertDockerRunToCompose(
        `docker run -e X="y" -e 'A=b c' --name="web" -v "$(pwd)":/app nginx sh -c 'echo hi'`,
      );
      expect(result.errors).toEqual([]);
      expect(result.yaml).toContain("image: nginx");
      expect(result.yaml).toContain("- X=y");
      expect(result.yaml).toContain("'A=b c'");
      expect(result.yaml).toContain("container_name: web");
      expect(result.yaml).toContain("$(pwd):/app");
    });

    it("keeps the output and lists an unknown option as an error", () => {
      const result = convertDockerRunToCompose("docker run --bogus-flag nginx");
      expect(result.yaml).toContain("image: nginx");
      expect(result.errors).toEqual(["Unknown option: bogus-flag"]);
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
