# Docker run to Compose converter

## Name
Docker run to Compose converter (`docker-run-to-docker-compose-converter`)

## Description
Transform a `docker run` (or `docker create`) command into a `docker-compose.yml` document. Uses `composerize-ts` for conversion and surfaces options that are not translatable or not yet implemented.

## Toggles and Settings
None — live conversion as you type.

## Inputs
- Docker run/create command (multiline textarea). Default sample matches it-tools:
  `docker run -p 80:80 -v /var/run/docker.sock:/tmp/docker.sock:ro --restart always --log-opt max-size=1g nginx`

## Outputs
- Generated `docker-compose.yml` YAML (copyable)
- Download as `docker-compose.yml`
- Advisory lists when present:
  - Options not translatable to compose
  - Options not yet implemented
  - Conversion errors

## Notes
- Conversion engine: `composerize-ts` `composerize()` (same package/version family as it-tools, `^0.6.2`)
- Input is trimmed before conversion
- Thrown errors fall back to empty YAML and empty message lists (it-tools `withDefaultOnError` parity)
- Download uses a Blob/`application/yaml` file (equivalent to it-tools base64 data-URL download)
- No compose-version toggle in the UI (library default, Compose 3.9)

## Source
Port of [it-tools Docker run to Docker compose converter](https://it-tools.tech/docker-run-to-docker-compose-converter). Local reference: handy-dandy `it-tools` (`src/tools/docker-run-to-docker-compose-converter`). Catalogue id: `docker-run-to-docker-compose-converter`.

## Files
- `src/lib/tools/docker-run-to-docker-compose-converter/` — service, types, tests, README
- `src/components/tools/islands/DockerRunToDockerComposeConverter.tsx` (+ `.css`)
- Mounted from `src/pages/tools/[slug].astro` when slug is `docker-run-to-docker-compose-converter`
- Dependency: `composerize-ts` in root `package.json`

## How to verify
```bash
npm test -- src/lib/tools/docker-run-to-docker-compose-converter
npm run build
```
Open `/tools/docker-run-to-docker-compose-converter`, edit the sample command, confirm YAML updates, try `--rm` / `--gpus` for advisory lists, copy and download.
