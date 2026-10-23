import { Button, ButtonGroup, IconButton } from "@/ui/react/groups/actions";
import { Spinner, Tooltip } from "@/ui/react/groups/feedback";
import { ThemePair } from "./ThemePair";

const placements = ["top", "bottom", "start", "end"] as const;
const stack = { display: "grid", gap: "var(--ui-space-sm)" } as const;

export function FeedbackShowcase() {
  return (
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
      </div>
    </ThemePair>
  );
}
