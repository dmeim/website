import { useState } from "react";
import { Badge, Card, Figure, StatusDot, Swatch } from "@/ui/react/groups/display";
import { ThemePair } from "./ThemePair";

const stack = { display: "grid", gap: "var(--ui-space-sm)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--ui-space-sm)" } as const;
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(12rem, 1fr))", gap: "var(--ui-space-sm)" } as const;

const tones = ["neutral", "accent", "success", "warning", "danger", "info"] as const;
const variants = ["soft", "outline", "solid"] as const;
const statuses = ["live", "wip", "archived", "idle", "busy", "success", "error"] as const;
const figureSrc = "/gpt-photoshoot/gpt-jackethold-transparent.png";
const swatches = [
  { color: "#8a6d3b", label: "Gold" },
  { color: "#3d6b48", label: "Green" },
  { color: "#a3442c", label: "Rust" },
];

export function DisplayShowcase() {
  const [picked, setPicked] = useState("Gold");
  return (
    <ThemePair>
      <div style={stack}>
        <h4 className="ui-showcase-sub">Badge</h4>
        {variants.map((variant) => (
          <div style={row} key={variant}>
            {tones.map((tone) => (
              <Badge key={tone} tone={tone} variant={variant}>{tone}</Badge>
            ))}
          </div>
        ))}
        <div style={row}>
          <Badge size="sm">sm</Badge>
          <Badge icon="lock">With icon</Badge>
          <Badge tone="accent" variant="solid" icon="check">Solid icon</Badge>
        </div>
        <h4 className="ui-showcase-sub">StatusDot</h4>
        <div style={row}>
          {statuses.map((status) => (
            <StatusDot key={status} status={status} label={status} />
          ))}
        </div>
        <div style={row}>
          <StatusDot status="live" label="Hidden label" labelHidden />
          <StatusDot status="live" pulse={false} label="No pulse" />
          <StatusDot status="idle" pulse label="Forced pulse" />
        </div>
        <h4 className="ui-showcase-sub">Card</h4>
        <div style={grid}>
          <Card eyebrow="Default" title="Static card" footer="Footer">Body text in a flat surface tile.</Card>
          <Card href="#display" eyebrow="Linked" title="Whole card link">Hover or focus the card.</Card>
          <Card tone="inset" padding="sm" title="Inset, padding sm">Inset tone with hairline.</Card>
          <Card tone="inset" padding="lg" interactive title="Inset, lg, interactive">Hover fill without a link.</Card>
          <Card
            as="article"
            padding="none"
            title="Padding none + media"
            media={<img src={figureSrc} alt="" width={320} height={180} style={{ aspectRatio: "16/9", objectFit: "cover" }} />}
          />
        </div>
        <h4 className="ui-showcase-sub">Figure</h4>
        <div style={grid}>
          <Figure src={figureSrc} alt="Portrait" caption="Plain figure" ratio="4 / 3" />
          <Figure src={figureSrc} alt="Portrait" caption="Framed figure" ratio="1" frame />
        </div>
        <h4 className="ui-showcase-sub">Swatch (buttons toggle)</h4>
        <div style={row}>
          {swatches.map((s) => (
            <Swatch
              key={s.label}
              as="button"
              color={s.color}
              label={s.label}
              value={s.color.toUpperCase()}
              selected={picked === s.label}
              onClick={() => setPicked(s.label)}
            />
          ))}
          <Swatch color="#4a5a6b" label="Static" code="--ui-info" size="lg" />
          <Swatch color="#171614" size="sm" />
        </div>
      </div>
    </ThemePair>
  );
}
