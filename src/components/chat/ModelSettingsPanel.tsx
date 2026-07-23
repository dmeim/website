import type { ChatProviderId } from "@/lib/chat/thinking";
import {
  CHAT_PROVIDERS,
  coerceThinkingLevel,
  isChatProviderId,
  thinkingLevelsForModel,
} from "@/lib/chat/thinking";
import type { GoModelInfo, ThinkingLevel } from "@/lib/chat/types";
import { ThinkingLevelThumb } from "./ThinkingLevelThumb";

type ModelSettingsPanelProps = {
  models: GoModelInfo[];
  chatProvider: ChatProviderId;
  modelId: string;
  thinkingLevel: ThinkingLevel;
  disabled?: boolean;
  onChatProviderChange: (provider: ChatProviderId) => void;
  onModelChange: (modelId: string) => void;
  onThinkingChange: (level: ThinkingLevel) => void;
};

export function ModelSettingsPanel({
  models,
  chatProvider,
  modelId,
  thinkingLevel,
  disabled = false,
  onChatProviderChange,
  onModelChange,
  onThinkingChange,
}: ModelSettingsPanelProps) {
  const providerModels = models.filter(
    (model) => model.chatProvider === chatProvider,
  );
  const options =
    providerModels.length > 0
      ? providerModels
      : models.length > 0
        ? models
        : [];
  const allowed = thinkingLevelsForModel(modelId);
  const safeThinking = coerceThinkingLevel(modelId, thinkingLevel);

  return (
    <div className="chat-model-settings" role="group" aria-label="Model settings">
      <label className="chat-model-settings__field">
        <span className="chat-model-settings__label">Provider</span>
        <select
          value={chatProvider}
          disabled={disabled}
          onChange={(event) => {
            const next = event.target.value;
            if (isChatProviderId(next)) onChatProviderChange(next);
          }}
        >
          {CHAT_PROVIDERS.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.label}
            </option>
          ))}
        </select>
      </label>

      <label className="chat-model-settings__field">
        <span className="chat-model-settings__label">Model</span>
        <select
          value={
            options.some((m) => m.id === modelId)
              ? modelId
              : (options[0]?.id ?? modelId)
          }
          disabled={disabled || options.length === 0}
          onChange={(event) => onModelChange(event.target.value)}
        >
          {options.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name || model.id}
            </option>
          ))}
        </select>
      </label>

      <div className="chat-model-settings__field">
        <span className="chat-model-settings__label" id="chat-thinking-label">
          Thinking
        </span>
        <ThinkingLevelThumb
          value={safeThinking}
          allowed={allowed}
          disabled={disabled}
          onChange={onThinkingChange}
        />
      </div>
    </div>
  );
}
