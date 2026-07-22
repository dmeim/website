import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  type ToolStatusTone,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { downloadTextFile } from "@/lib/tools/download";
import {
  DEFAULT_DOCKER_RUN,
  convertDockerRunToCompose,
} from "@/lib/tools/docker-run-to-docker-compose-converter";

import "./DockerRunToDockerComposeConverter.css";

function MessageList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: ToolStatusTone;
}) {
  if (items.length === 0) return null;

  return (
    <div className="d2c-messages" role="status" aria-live="polite">
      <ToolStatus tone={tone} live="off">
        {title}
      </ToolStatus>
      <ul className="d2c-messages__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function DockerRunToDockerComposeConverter() {
  const [dockerRun, setDockerRun] = useState(DEFAULT_DOCKER_RUN);
  const [actionStatus, setActionStatus] = useState("");

  const conversion = useMemo(
    () => convertDockerRunToCompose(dockerRun),
    [dockerRun],
  );

  const yaml = conversion.yaml;
  const canExport = yaml !== "";

  const copyYaml = useCallback(async () => {
    if (!canExport) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(yaml);
      setActionStatus("Compose YAML copied.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [canExport, yaml]);

  const downloadYaml = useCallback(() => {
    if (!canExport) {
      setActionStatus("Nothing to download yet.");
      return;
    }

    downloadTextFile("docker-compose.yml", yaml, "application/yaml");
    setActionStatus("docker-compose.yml download started.");
  }, [canExport, yaml]);

  return (
    <ToolIsland className="d2c-tool">
      <ToolPanel labelledBy="d2c-heading" className="d2c-tool__panel">
        <ToolSectionHeading
          title="Docker run → Compose"
          titleId="d2c-heading"
          description={
            <ToolHint>
              Paste a <code>docker run</code> command to generate a{" "}
              <code>docker-compose.yml</code>. Unsupported options are listed
              below the output.
            </ToolHint>
          }
        />

        <ToolTextarea
          id="d2c-input"
          label="Your docker run command"
          full
          code
          rows={4}
          value={dockerRun}
          placeholder="Your docker run command to convert..."
          onChange={(event) => setDockerRun(event.target.value)}
          autoFocus
        />

        <ToolTextarea
          id="d2c-output"
          label="docker-compose.yml"
          full
          code
          readOnly
          rows={14}
          value={yaml}
          placeholder="Compose YAML appears here"
          className="d2c-output"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyYaml()}
            disabled={!canExport}
          >
            Copy YAML
          </ToolButton>
          <ToolButton
            type="button"
            onClick={downloadYaml}
            disabled={!canExport}
          >
            Download docker-compose.yml
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}

        <MessageList
          title="These options are not translatable to docker-compose"
          items={conversion.notTranslatable}
          tone="accent"
        />
        <MessageList
          title="These options are not yet implemented and therefore haven't been translated to docker-compose"
          items={conversion.notImplemented}
          tone="accent"
        />
        <MessageList
          title="The following errors occurred"
          items={conversion.errors}
          tone="error"
        />
      </ToolPanel>
    </ToolIsland>
  );
}
