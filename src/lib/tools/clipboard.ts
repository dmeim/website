export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  fallbackCopyText(text);
}

/**
 * A modal dialog makes everything outside it inert, so a helper textarea
 * appended to <body> cannot be selected and `execCommand("copy")` fails.
 * Mount it inside the open modal instead.
 */
function fallbackHost(): HTMLElement {
  try {
    return document.querySelector<HTMLElement>("dialog:modal") ?? document.body;
  } catch {
    return document.querySelector<HTMLElement>("dialog[open]") ?? document.body;
  }
}

function fallbackCopyText(text: string): void {
  const previousFocus = document.activeElement as HTMLElement | null;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  // 16px stops iOS Safari zooming into the field when it takes focus.
  textarea.style.fontSize = "16px";

  fallbackHost().appendChild(textarea);
  textarea.focus();
  textarea.select();
  // iOS Safari ignores select() on its own.
  textarea.setSelectionRange(0, text.length);

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("Copy command was rejected.");
    }
  } finally {
    textarea.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}
