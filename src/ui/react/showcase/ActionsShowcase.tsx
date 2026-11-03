import { useState } from "react";
import { Button, ButtonGroup, CopyButton, IconButton, Toolbar } from "@/ui/react/groups/actions";
import { ThemePair } from "./ThemePair";

const variants = ["primary", "secondary", "ghost", "danger"] as const;
const sizes = ["sm", "md", "lg"] as const;
const stack = { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "var(--ui-space-sm)" } as const;
const stage = {
  position: "relative",
  minHeight: "8rem",
  background: "var(--ui-bg-inset)",
  borderRadius: "var(--ui-radius-panel)",
} as const;

export function ActionsShowcase() {
  const [pressed, setPressed] = useState(true);
  const [loading, setLoading] = useState(false);

  return (
    <ThemePair>
      <div style={stack}>
        <h4 className="ui-showcase-sub">Button: variant × size</h4>
        {variants.map((variant) => (
          <ButtonGroup key={variant}>
            {sizes.map((size) => (
              <Button key={size} variant={variant} size={size} iconStart="plus">{`${variant} ${size}`}</Button>
            ))}
          </ButtonGroup>
        ))}
        <h4 className="ui-showcase-sub">Button: disabled, loading, pressed, link</h4>
        {variants.map((variant) => (
          <ButtonGroup key={variant}>
            <Button variant={variant} disabled>Disabled</Button>
            <Button variant={variant} loading>Loading</Button>
            <Button variant={variant} pressed iconStart="eye">Pressed</Button>
            <Button variant={variant} href="#actions" iconEnd="arrow-right">Link</Button>
            <Button variant={variant} href="#actions" disabled>Disabled link</Button>
          </ButtonGroup>
        ))}
        <h4 className="ui-showcase-sub">Live toggle and loading</h4>
        <ButtonGroup>
          <Button pressed={pressed} iconStart="eye" onClick={() => setPressed((p) => !p)}>Toggle</Button>
          <Button
            variant="primary"
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1500);
            }}
          >
            Save changes
          </Button>
        </ButtonGroup>
        <Button fullWidth variant="primary">Full width</Button>

        <h4 className="ui-showcase-sub">IconButton</h4>
        {variants.map((variant) => (
          <ButtonGroup key={variant}>
            {sizes.map((size) => (
              <IconButton key={size} icon="gear" label={`Settings ${size}`} variant={variant} size={size} />
            ))}
            <IconButton icon="eye" label="Pressed" variant={variant} pressed />
            <IconButton icon="trash" label="Disabled" variant={variant} disabled />
            <IconButton icon="link" label="Link" variant={variant} href="#actions" tooltip={false} />
          </ButtonGroup>
        ))}

        <h4 className="ui-showcase-sub">CopyButton: button, icon, inline</h4>
        <ButtonGroup>
          <CopyButton value="React button copy" />
          <CopyButton value="React primary copy" variant="primary" size="sm" />
          <CopyButton getValue={() => new Date().toISOString()} appearance="icon" label="Copy timestamp" />
          <CopyButton value="React inline copy" appearance="inline" />
          <CopyButton value="x" disabled />
        </ButtonGroup>

        <h4 className="ui-showcase-sub">ButtonGroup: align, attached</h4>
        <ButtonGroup align="end" label="End aligned"><Button>Cancel</Button><Button variant="primary">Save</Button></ButtonGroup>
        <ButtonGroup align="between"><Button>Back</Button><Button variant="primary">Next</Button></ButtonGroup>
        <ButtonGroup align="stretch"><Button>One</Button><Button>Two</Button><Button>Three</Button></ButtonGroup>
        <ButtonGroup attached label="Alignment"><Button pressed>Left</Button><Button>Center</Button><Button>Right</Button></ButtonGroup>

        <h4 className="ui-showcase-sub">Toolbar: inline, vertical, floating (arrow keys move focus)</h4>
        <Toolbar label="Formatting">
          <IconButton icon="code" label="Code" pressed tooltip={false} />
          <IconButton icon="image" label="Image" tooltip={false} />
          <IconButton icon="link" label="Link" tooltip={false} />
          <Button size="sm">Clear</Button>
        </Toolbar>
        <Toolbar label="Vertical tools" orientation="vertical" style={{ width: "max-content" }}>
          <IconButton icon="plus" label="Add" tooltip={false} />
          <IconButton icon="minus" label="Remove" tooltip={false} />
        </Toolbar>
        <div style={stage}>
          <Toolbar label="Stage top" placement="floating-top">
            <IconButton icon="play" label="Play" tooltip={false} />
            <IconButton icon="pause" label="Pause" tooltip={false} />
          </Toolbar>
          <Toolbar label="Stage bottom" placement="floating-bottom">
            <Button size="sm" variant="ghost">Step</Button>
            <Button size="sm" variant="primary">Run</Button>
          </Toolbar>
        </div>
      </div>
    </ThemePair>
  );
}
