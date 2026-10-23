import { useCallback, useEffect, useRef, useState } from "react";
import { copyTextToClipboard } from "@/ui/lib/clipboard";

export type UseCopyOptions = {
  resetAfter?: number;
  onCopied?: () => void;
};

/** Copy text to the clipboard and expose a transient `copied` flag. */
export function useCopy({ resetAfter = 1600, onCopied }: UseCopyOptions = {}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await copyTextToClipboard(text);
      } catch (error) {
        console.error("[ui:copy] clipboard write failed", error);
        return false;
      }
      setCopied(true);
      onCopied?.();
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), resetAfter);
      return true;
    },
    [onCopied, resetAfter],
  );

  return { copied, copy };
}
