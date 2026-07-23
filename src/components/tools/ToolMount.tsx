import { lazy, Suspense, useMemo, type ComponentType } from "react";
import { getToolLoader } from "./toolRegistry";

type Props = {
  slug: string;
};

function ToolFallback() {
  return (
    <p className="tools-mount__status" role="status">
      Loading tool…
    </p>
  );
}

function UnknownTool({ slug }: { slug: string }) {
  return (
    <p className="tools-mount__status">
      Unknown tool <code>{slug}</code>.
    </p>
  );
}

export function ToolMount({ slug }: Props) {
  const Island = useMemo(() => {
    const loader = getToolLoader(slug);
    if (!loader) return null;
    return lazy(loader) as ComponentType;
  }, [slug]);

  if (!Island) {
    return <UnknownTool slug={slug} />;
  }

  return (
    <div className="tools-mount" data-tool={slug}>
      <Suspense fallback={<ToolFallback />}>
        <Island />
      </Suspense>
    </div>
  );
}
