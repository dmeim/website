import { useState } from "react";
import { AppShell, Cluster, Container, Grid, ImmersiveStage, PageHeader, Reveal, SectionHeading, Stack } from "@/ui/react/groups/layout";
import { Button, IconButton, Toolbar } from "@/ui/react/groups/actions";
import { Link } from "@/ui/react/groups/text";
import { ThemePair } from "./ThemePair";

const tile = {
  background: "var(--ui-surface)",
  borderRadius: "var(--ui-radius-control)",
  padding: "var(--ui-space-sm)",
  fontSize: "var(--ui-fs-sm)",
} as const;

export function LayoutShowcase() {
  return (
    <ThemePair>
      <Stack gap="lg">
        <h4 className="ui-showcase-sub">PageHeader</h4>
        <PageHeader
          eyebrow="Tools"
          title="Base64 encoder"
          lede="Encode and decode text or files locally. Nothing leaves your browser."
          meta={<><span>Encoding</span><span>Works offline</span></>}
          actions={<Link href="#layout" arrow="right">All tools</Link>}
        />
        <h4 className="ui-showcase-sub">SectionHeading</h4>
        <SectionHeading title="Input" description="Paste text or drop a file" trailing={<Link href="#layout" tone="quiet">Clear</Link>} />
        <h4 className="ui-showcase-sub">Container (narrow, outlined)</h4>
        <Container width="narrow" style={{ outline: "1px dashed var(--ui-line-strong)" }}><p>Narrow container content.</p></Container>
        <h4 className="ui-showcase-sub">Stack / Cluster / Grid</h4>
        <Stack gap="xs"><div style={tile}>Stack xs</div><div style={tile}>Second</div></Stack>
        <Cluster gap="sm" justify="between"><div style={tile}>Cluster</div><div style={tile}>between</div></Cluster>
        <Grid min="8rem" gap="sm">{["Astro", "React", "CSS", "Workers", "TypeScript"].map((t) => <div key={t} style={tile}>{t}</div>)}</Grid>
        <h4 className="ui-showcase-sub">Reveal</h4>
        <Reveal style={tile}>Fades up on scroll</Reveal>
        <Reveal style={tile} delay={0.08} as="p">Delayed paragraph</Reveal>
        <h4 className="ui-showcase-sub">AppShell (bounded frame)</h4>
        <AppShellDemo />
        <h4 className="ui-showcase-sub">ImmersiveStage (bounded frame)</h4>
        <ImmersiveDemo />
      </Stack>
    </ThemePair>
  );
}

const frame = {
  position: "relative",
  height: "16rem",
  overflow: "hidden",
  transform: "translateZ(0)",
  border: "1px solid var(--ui-line)",
  borderRadius: "var(--ui-radius-control)",
} as const;

function AppShellDemo() {
  const [open, setOpen] = useState(false);
  return (
    <div style={frame}>
      <AppShell
        style={{ height: "100%" }}
        sidebarLabel="Demo navigation"
        sidebarOpen={open}
        onSidebarOpenChange={setOpen}
        sidebar={<Stack gap="xs" style={{ padding: "var(--ui-space-sm)" }}><div style={tile}>Sidebar item</div><div style={tile}>Another item</div></Stack>}
        header={<Cluster gap="sm" style={{ padding: "var(--ui-space-xs) var(--ui-space-sm)" }}><IconButton icon="list" label="Toggle sidebar" size="sm" onClick={() => setOpen(!open)} /><span>Header row</span></Cluster>}
      >
        <Stack gap="sm" style={{ padding: "var(--ui-space-md)" }}>{Array.from({ length: 8 }, (_, i) => <div key={i} style={tile}>Main content {i + 1}</div>)}</Stack>
      </AppShell>
    </div>
  );
}

function ImmersiveDemo() {
  const [idle, setIdle] = useState(false);
  return (
    <div style={frame}>
      <ImmersiveStage
        label="Demo stage"
        idle={idle}
        toolbar={
          <Toolbar label="Stage controls" placement="floating-bottom">
            <Button size="sm" variant="secondary" pressed={idle} onClick={() => setIdle(!idle)}>{idle ? "Wake" : "Idle"}</Button>
          </Toolbar>
        }
      >
        <p style={{ padding: "var(--ui-space-md)", margin: 0 }}>Canvas area. Idle hides the toolbar until it gets focus.</p>
      </ImmersiveStage>
    </div>
  );
}
