import { SegmentedControl } from "@/ui/react";
import {
  THINKING_LEVELS,
  THINKING_LEVEL_LABELS,
} from "@/lib/chat/thinking";
import type { ThinkingLevel } from "@/lib/chat/types";

type ThinkingLevelThumbProps = {
  value: ThinkingLevel;
  allowed: ThinkingLevel[];
  onChange: (level: ThinkingLevel) => void;
  disabled?: boolean;
};

export function ThinkingLevelThumb({
  value,
  allowed,
  onChange,
  disabled = false,
}: ThinkingLevelThumbProps) {
  return (
    <SegmentedControl
      name="chat-thinking-level"
      label="Thinking"
      size="sm"
      className="chat-thinking-toggle"
      data-thinking={value}
      disabled={disabled}
      value={value}
      options={THINKING_LEVELS.map((level) => ({
        value: level,
        label: THINKING_LEVEL_LABELS[level],
        disabled: !allowed.includes(level),
      }))}
      onChange={(next) => {
        const level = next as ThinkingLevel;
        if (disabled || !allowed.includes(level)) return;
        onChange(level);
      }}
    />
  );
}
