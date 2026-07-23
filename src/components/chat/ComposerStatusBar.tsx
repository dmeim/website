import { ArrowDown, ArrowUp, Brain } from "lucide";
import type { ChatProviderId } from "@/lib/chat/thinking";
import {
  CHAT_PROVIDERS,
  THINKING_LEVEL_LABELS,
  coerceThinkingLevel,
} from "@/lib/chat/thinking";
import type { ChatGenerationMetadata } from "@/lib/chat";
import {
  aggregateChatTokenTotals,
  formatTokenCount,
} from "@/lib/chat/message-metrics";
import type { GoModelInfo, ThinkingLevel } from "@/lib/chat/types";
import { LucideIcon } from "./LucideIcon";

type ComposerStatusBarProps = {
  models: GoModelInfo[];
  modelId: string;
  chatProvider: ChatProviderId;
  thinkingLevel: ThinkingLevel;
  generations: Array<ChatGenerationMetadata | null | undefined>;
};

export function ComposerStatusBar({
  models,
  modelId,
  chatProvider,
  thinkingLevel,
  generations,
}: ComposerStatusBarProps) {
  const providerLabel =
    CHAT_PROVIDERS.find((p) => p.id === chatProvider)?.label ?? chatProvider;
  const modelLabel =
    models.find((m) => m.id === modelId)?.name?.trim() || modelId;
  const thinkingLabel =
    THINKING_LEVEL_LABELS[coerceThinkingLevel(modelId, thinkingLevel)];

  const totals = aggregateChatTokenTotals(generations);
  const tokenItems: Array<{
    key: string;
    icon: typeof ArrowUp;
    label: string;
    value: string;
  }> = [];

  if (totals.hasMetrics) {
    if (totals.inputTokens > 0) {
      tokenItems.push({
        key: "input",
        icon: ArrowUp,
        label: "Total input tokens",
        value: formatTokenCount(totals.inputTokens),
      });
    }
    if (totals.outputTokens > 0) {
      tokenItems.push({
        key: "output",
        icon: ArrowDown,
        label: "Total output tokens",
        value: formatTokenCount(totals.outputTokens),
      });
    }
    if (totals.reasoningTokens > 0) {
      tokenItems.push({
        key: "reasoning",
        icon: Brain,
        label: "Total reasoning tokens",
        value: formatTokenCount(totals.reasoningTokens),
      });
    }
  }

  return (
    <div className="chat-composer__status" aria-label="Chat status">
      <p className="chat-composer__status-left">
        <span title="Provider">{providerLabel}</span>
        <span className="chat-composer__status-sep" aria-hidden="true">
          ·
        </span>
        <span title="Model">{modelLabel}</span>
        <span className="chat-composer__status-sep" aria-hidden="true">
          ·
        </span>
        <span title="Thinking">{thinkingLabel}</span>
      </p>
      {tokenItems.length > 0 ? (
        <p className="chat-composer__status-right" aria-label="Chat token totals">
          {tokenItems.map((item) => (
            <span
              key={item.key}
              className="chat-composer__status-metric"
              title={item.label}
            >
              <LucideIcon icon={item.icon} size={12} />
              <span>{item.value}</span>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
