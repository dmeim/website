import type { ChatProviderId } from "@/lib/chat/thinking";
import {
  CHAT_PROVIDERS,
  coerceThinkingLevel,
  isChatProviderId,
  thinkingLevelsForModel,
} from "@/lib/chat/thinking";
import type { GoModelInfo, ThinkingLevel } from "@/lib/chat/types";
import { Select } from "@/ui/react";
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

  const modelValue = options.some((m) => m.id === modelId)
    ? modelId
    : (options[0]?.id ?? modelId);

  return (
    <div className="chat-model-settings" role="group" aria-label="Model settings">
      <Select
        label="Provider"
        size="sm"
        value={chatProvider}
        disabled={disabled}
        options={CHAT_PROVIDERS.map((provider) => ({
          value: provider.id,
          label: provider.label,
        }))}
        onChange={(event) => {
          const next = event.target.value;
          if (isChatProviderId(next)) onChatProviderChange(next);
        }}
      />
      <Select
        label="Model"
        size="sm"
        value={modelValue}
        disabled={disabled || options.length === 0}
        options={options.map((model) => ({
          value: model.id,
          label: model.name || model.id,
        }))}
        onChange={(event) => onModelChange(event.target.value)}
      />
      <ThinkingLevelThumb
        value={safeThinking}
        allowed={allowed}
        disabled={disabled}
        onChange={onThinkingChange}
      />
    </div>
  );
}
