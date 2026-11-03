import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, Notice, OutputField, Panel, Textarea, ToolFrame, type NoticeTone } from "@/ui/react";
import { downloadTextFile } from "@/lib/tools/download";
import {
  DEFAULT_DOCKER_RUN,
  convertDockerRunToCompose,
} from "@/lib/tools/docker-run-to-docker-compose-converter";

import "./DockerRunToDockerComposeConverter.css";

function MessageList({ title, items, tone }: { title: string; items: string[]; tone: NoticeTone }) {
  if (items.length === 0) return null;

  return (
    <Notice tone={tone} title={title} live="polite">
      <ul className="d2c-messages__list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Notice>
  );
}

export default function DockerRunToDockerComposeConverter() {
  const [dockerRun, setDockerRun] = useState(DEFAULT_DOCKER_RUN);
  const [actionStatus, setActionStatus] = useState("");

  const conversion = useMemo(() => convertDockerRunToCompose(dockerRun), [dockerRun]);

  const yaml = conversion.yaml;
  const canExport = yaml !== "";

  const downloadYaml = useCallback(() => {
    if (!canExport) {
      setActionStatus("Nothing to download yet.");
      return;
    }

    downloadTextFile("docker-compose.yml", yaml, "application/yaml");
    setActionStatus("docker-compose.yml download started.");
  }, [canExport, yaml]);

  return (
    <ToolFrame>
      <Panel
        title="Docker run to Compose"
        titleId="d2c-heading"
        description={
          <>
            Paste a <code>docker run</code> command to generate a <code>docker-compose.yml</code>. Unsupported
            options are listed below the output.
          </>
        }
      >
        <Textarea
          id="d2c-input"
          label="Your docker run command"
          mono
          rows={4}
          value={dockerRun}
          placeholder="Your docker run command to convert…"
          onChange={(event) => setDockerRun(event.target.value)}
          autoFocus
        />

        <OutputField
          id="d2c-output"
          label="docker-compose.yml"
          multiline
          rows={14}
          value={yaml}
          copy={false}
          placeholder="Compose YAML appears here"
        />

        <ButtonGroup>
          <CopyButton value={yaml} label="Copy YAML" disabled={!canExport} />
          <Button variant="secondary" iconStart="download-simple" onClick={downloadYaml} disabled={!canExport}>
            Download docker-compose.yml
          </Button>
        </ButtonGroup>

        {actionStatus ? <Notice tone="success">{actionStatus}</Notice> : null}

        <MessageList
          title="These options are not translatable to docker-compose"
          items={conversion.notTranslatable}
          tone="warning"
        />
        <MessageList
          title="These options are not yet implemented and therefore haven't been translated to docker-compose"
          items={conversion.notImplemented}
          tone="warning"
        />
        <MessageList title="The following errors occurred" items={conversion.errors} tone="danger" />
      </Panel>
    </ToolFrame>
  );
}
