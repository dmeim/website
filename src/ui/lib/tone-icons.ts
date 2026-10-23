import type { IconName } from "@/ui/icons";
import type { ToastTone } from "./toast";

export type Tone = ToastTone;

/** Default Notice/Toast icon per tone. */
export const TONE_ICONS: Record<Tone, IconName> = {
  neutral: "info",
  info: "info",
  success: "check-circle",
  warning: "warning",
  danger: "warning-circle",
  accent: "info",
};
