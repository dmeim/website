import type { CSSProperties } from "react";
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
  const index = Math.max(0, THINKING_LEVELS.indexOf(value));

  return (
    <div
      className="chat-thinking-toggle"
      role="radiogroup"
      aria-label="Thinking level"
      data-thinking={value}
      style={{ ["--thinking-index" as string]: String(index) } as CSSProperties}
    >
      <span className="chat-thinking-toggle__thumb" aria-hidden="true" />
      {THINKING_LEVELS.map((level) => {
        const enabled = allowed.includes(level);
        const selected = value === level;
        return (
          <button
            key={level}
            type="button"
            className="chat-thinking-toggle__option"
            role="radio"
            aria-label={THINKING_LEVEL_LABELS[level]}
            aria-checked={selected}
            aria-disabled={!enabled || disabled}
            disabled={disabled || !enabled}
            tabIndex={selected ? 0 : -1}
            data-thinking-option={level}
            onClick={() => {
              if (!enabled || disabled) return;
              onChange(level);
            }}
          >
            <span className="chat-thinking-toggle__label">
              {THINKING_LEVEL_LABELS[level]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
