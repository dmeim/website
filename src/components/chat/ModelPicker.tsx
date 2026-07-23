import type { GoModelInfo } from "@/lib/chat/types";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/chat/constants";

type ModelPickerProps = {
  models: GoModelInfo[];
  value: string;
  onChange: (modelId: string) => void;
  disabled?: boolean;
};

export function ModelPicker({
  models,
  value,
  onChange,
  disabled = false,
}: ModelPickerProps) {
  const options =
    models.length > 0
      ? models
      : [
          {
            id: value || DEFAULT_CHAT_MODEL_ID,
            name: value || "DeepSeek V4 Flash",
            provider: "openai-compatible" as const,
          },
        ];

  return (
    <label className="chat-main__model">
      <span className="visually-hidden">Model</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name || model.id}
          </option>
        ))}
      </select>
    </label>
  );
}
