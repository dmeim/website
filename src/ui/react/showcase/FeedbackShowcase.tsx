import { Button, ButtonGroup, IconButton } from "@/ui/react/groups/actions";
import { useState } from "react";
import { EmptyState, Notice, Progress, Skeleton, Spinner, Toaster, Tooltip, toast } from "@/ui/react/groups/feedback";
import { ThemePair } from "./ThemePair";

const placements = ["top", "bottom", "start", "end"] as const;
const tones = ["neutral", "info", "success", "warning", "danger", "accent"] as const;
const stack = { display: "grid", gap: "var(--ui-space-sm)" } as const;

export function FeedbackShowcase() {
  const [run, setRun] = useState(0);
  return (
    <>
    <ThemePair>
      <div style={stack}>
        <h4 className="ui-showcase-sub">Spinner: sm, md, lg</h4>
        <ButtonGroup>
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" label="Loading fonts" />
        </ButtonGroup>
        <h4 className="ui-showcase-sub">Tooltip: placements, delay (hover or focus; Escape hides)</h4>
        <ButtonGroup>
          {placements.map((placement) => (
            <Tooltip key={placement} content={`Tooltip ${placement}`} placement={placement}>
              <Button size="sm">{placement}</Button>
            </Tooltip>
          ))}
          <Tooltip content="No delay" delay={0}>
            <Button size="sm">delay 0</Button>
          </Tooltip>
          <IconButton icon="info" label="IconButton tooltip" />
        </ButtonGroup>
        <h4 className="ui-showcase-sub">Notice: inline and callout</h4>
        {tones.map((tone) => (
          <Notice key={tone} tone={tone}>
            Inline {tone} status line.
          </Notice>
        ))}
        <Notice variant="callout" tone="warning" title="Unsaved changes" actions={<Button size="sm">Save</Button>}>
          Leaving now discards your edits.
        </Notice>
        <h4 className="ui-showcase-sub">Toast (Toaster mounted in this island)</h4>
        <ButtonGroup>
          {tones.map((tone) => (
            <Button key={tone} size="sm" onClick={() => toast({ message: `A ${tone} toast.`, tone })}>
              {tone}
            </Button>
          ))}
          <Button
            size="sm"
            onClick={() => toast({ message: "Chat archived.", action: { label: "Undo", onClick: () => toast({ message: "Restored.", tone: "success" }) } })}
          >
            with action
          </Button>
          <Button size="sm" onClick={() => toast({ message: "Sticky toast (Escape or close).", duration: 0 })}>
            sticky
          </Button>
        </ButtonGroup>
        <h4 className="ui-showcase-sub">Skeleton</h4>
        <div aria-busy="true" style={stack}>
          <Skeleton width="40%" height="1.25rem" />
          <Skeleton lines={3} />
        </div>
        <h4 className="ui-showcase-sub">Progress</h4>
        <Progress label="Upload" value={40} />
        <Progress label="Hashing" indeterminate size="sm" />
        <Progress key={run} label="Code expires in 5s" duration={5000} tone="accent" />
        <Button size="sm" onClick={() => setRun((n) => n + 1)}>
          Restart countdown
        </Button>
        <h4 className="ui-showcase-sub">EmptyState</h4>
        <EmptyState icon="magnifying-glass" title="No tools match" description="Clear the filter." action={{ label: "Clear", onClick: () => undefined }} />
      </div>
    </ThemePair>
    <Toaster />
    </>
  );
}
