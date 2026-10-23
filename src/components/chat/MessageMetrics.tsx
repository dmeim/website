import type { ReactNode } from "react";
import type { ChatGenerationMetadata } from "@/lib/chat";
import {
  formatDurationMs,
  formatTokenCount,
  formatTokensPerSecond,
  metricsForDisplay,
} from "@/lib/chat/message-metrics";
import { Icon, type IconName } from "@/ui/icons";
import { KeyValue } from "@/ui/react";

type MessageMetricsProps = {
  generation?: ChatGenerationMetadata | null;
  /** Right-aligned icon actions (edit / regenerate / fork). */
  actions?: ReactNode;
};

export function MessageMetrics({ generation, actions }: MessageMetricsProps) {
  const metrics = metricsForDisplay(generation);

  const tokenItems: Array<{
    key: string;
    icon: IconName;
    label: string;
    value: string;
  }> = [];

  const perfItems: Array<{
    key: string;
    icon: IconName;
    label: string;
    value: string;
  }> = [];

  if (metrics) {
    if (typeof metrics.inputTokens === "number") {
      tokenItems.push({
        key: "input",
        icon: "arrow-up",
        label: "Input tokens",
        value: formatTokenCount(metrics.inputTokens),
      });
    }
    if (typeof metrics.outputTokens === "number") {
      tokenItems.push({
        key: "output",
        icon: "arrow-down",
        label: "Output tokens",
        value: formatTokenCount(metrics.outputTokens),
      });
    }
    if (typeof metrics.reasoningTokens === "number") {
      tokenItems.push({
        key: "reasoning",
        icon: "brain",
        label: "Reasoning tokens",
        value: formatTokenCount(metrics.reasoningTokens),
      });
    }
    if (typeof metrics.outputTokensPerSecond === "number") {
      perfItems.push({
        key: "tps",
        icon: "gauge",
        label: "Output tokens per second",
        value: formatTokensPerSecond(metrics.outputTokensPerSecond),
      });
    }
    if (typeof metrics.responseTimeMs === "number") {
      perfItems.push({
        key: "duration",
        icon: "clock",
        label: "Response duration",
        value: formatDurationMs(metrics.responseTimeMs),
      });
    }
  }

  const hasMetrics = tokenItems.length > 0 || perfItems.length > 0;
  if (!hasMetrics && !actions) return null;

  const items = [...tokenItems, ...perfItems].map((item) => ({
    label: item.label,
    value: (
      <span className="chat-metrics__value" title={item.label}>
        <Icon name={item.icon} size={12} />
        {item.value}
      </span>
    ),
  }));

  return (
    <div className="chat-message__status">
      {hasMetrics ? (
        <KeyValue
          className="chat-metrics"
          layout="inline"
          density="compact"
          items={items}
          aria-label="Generation metrics"
        />
      ) : (
        <span className="chat-message__status-spacer" />
      )}
      {actions ? (
        <div className="chat-message__actions">{actions}</div>
      ) : null}
    </div>
  );
}
