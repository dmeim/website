import { Component, lazy, Suspense, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Button, Notice, Skeleton } from "@/ui/react";
import { getToolLoader } from "./toolRegistry";

type Props = {
  slug: string;
};

function ToolFallback() {
  return (
    <div className="tools-mount__loading" role="status" aria-busy="true">
      <span className="ui-visually-hidden">Loading tool…</span>
      <Skeleton height="2.25rem" width="40%" />
      <Skeleton lines={3} />
      <Skeleton height="8rem" radius="panel" />
    </div>
  );
}

function UnknownTool({ slug }: { slug: string }) {
  return (
    <Notice tone="warning">
      Unknown tool <code>{slug}</code>.
    </Notice>
  );
}

type BoundaryProps = { children: ReactNode; onRetry: () => void };
type BoundaryState = { failed: boolean };

/** Keeps a failed tool chunk or render error from taking down the whole shell. */
class ToolErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[tools] tool failed to render", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Notice
        tone="danger"
        variant="callout"
        title="This tool failed to load"
        actions={
          <Button
            size="sm"
            iconStart="arrows-clockwise"
            onClick={() => {
              this.setState({ failed: false });
              this.props.onRetry();
            }}
          >
            Try again
          </Button>
        }
      >
        Check your connection and try again. Other tools keep working.
      </Notice>
    );
  }
}

export function ToolMount({ slug }: Props) {
  const [attempt, setAttempt] = useState(0);
  const Island = useMemo(() => {
    const loader = getToolLoader(slug);
    if (!loader) return null;
    return lazy(loader) as ComponentType;
    // `attempt` re-creates the lazy component so a failed chunk is fetched again.
  }, [slug, attempt]);

  if (!Island) {
    return <UnknownTool slug={slug} />;
  }

  return (
    <div className="tools-mount" data-tool={slug}>
      <ToolErrorBoundary key={`${slug}-${attempt}`} onRetry={() => setAttempt((n) => n + 1)}>
        <Suspense fallback={<ToolFallback />}>
          <Island />
        </Suspense>
      </ToolErrorBoundary>
    </div>
  );
}
