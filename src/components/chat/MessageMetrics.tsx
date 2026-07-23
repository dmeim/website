import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Brain, Clock, Gauge } from "lucide";
import type { ChatGenerationMetadata } from "@/lib/chat";
import {
  formatDurationMs,
  formatTokenCount,
  formatTokensPerSecond,
  metricsForDisplay,
} from "@/lib/chat/message-metrics";
import { LucideIcon } from "./LucideIcon";

type MessageMetricsProps = {
  generation?: ChatGenerationMetadata | null;
  /** Right-aligned icon actions (edit / regenerate / fork). */
  actions?: ReactNode;
};

export function MessageMetrics({ generation, actions }: MessageMetricsProps) {
  const metrics = metricsForDisplay(generation);

  const tokenItems: Array<{
    key: string;
    icon: typeof ArrowUp;
    label: string;
    value: string;
  }> = [];

  const perfItems: Array<{
    key: string;
    icon: typeof Gauge;
    label: string;
    value: string;
  }> = [];

  if (metrics) {
    if (typeof metrics.inputTokens === "number") {
      tokenItems.push({
        key: "input",
        icon: ArrowUp,
        label: "Input tokens",
        value: formatTokenCount(metrics.inputTokens),
      });
    }
    if (typeof metrics.outputTokens === "number") {
      tokenItems.push({
        key: "output",
        icon: ArrowDown,
        label: "Output tokens",
        value: formatTokenCount(metrics.outputTokens),
      });
    }
    if (typeof metrics.reasoningTokens === "number") {
      tokenItems.push({
        key: "reasoning",
        icon: Brain,
        label: "Reasoning tokens",
        value: formatTokenCount(metrics.reasoningTokens),
      });
    }
    if (typeof metrics.outputTokensPerSecond === "number") {
      perfItems.push({
        key: "tps",
        icon: Gauge,
        label: "Output tokens per second",
        value: formatTokensPerSecond(metrics.outputTokensPerSecond),
      });
    }
    if (typeof metrics.responseTimeMs === "number") {
      perfItems.push({
        key: "duration",
        icon: Clock,
        label: "Response duration",
        value: formatDurationMs(metrics.responseTimeMs),
      });
    }
  }

  const hasMetrics = tokenItems.length > 0 || perfItems.length > 0;
  if (!hasMetrics && !actions) return null;

  return (
    <div className="chat-bubble__status">
      {hasMetrics ? (
        <p className="chat-bubble__metrics" aria-label="Generation metrics">
          {tokenItems.map((item) => (
            <span
              key={item.key}
              className="chat-bubble__metric"
              title={item.label}
            >
              <LucideIcon icon={item.icon} size={12} />
              <span>{item.value}</span>
            </span>
          ))}
          {tokenItems.length > 0 && perfItems.length > 0 ? (
            <span className="chat-bubble__metric-sep" aria-hidden="true">
              ·
            </span>
          ) : null}
          {perfItems.map((item) => (
            <span
              key={item.key}
              className="chat-bubble__metric"
              title={item.label}
            >
              <LucideIcon icon={item.icon} size={12} />
              <span>{item.value}</span>
            </span>
          ))}
        </p>
      ) : (
        <span className="chat-bubble__metrics chat-bubble__metrics--empty" />
      )}
      {actions ? (
        <div className="chat-bubble__status-actions">{actions}</div>
      ) : null}
    </div>
  );
}
