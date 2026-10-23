import { Cluster, Container, Grid, PageHeader, Reveal, SectionHeading, Stack } from "@/ui/react/groups/layout";
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
      </Stack>
    </ThemePair>
  );
}
