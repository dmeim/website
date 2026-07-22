/**
 * Format KeyboardEvent snapshots for display.
 * Parity with it-tools keycode-info.
 */

export type KeyEventSnapshot = {
  key: string;
  /** Legacy numeric keyCode (deprecated but still useful for debugging). */
  keyCode: number;
  code: string;
  location: number;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
};

export type KeycodeField = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
};

/** Join active modifiers like it-tools (`Meta + Shift + Ctrl + Alt`). */
export function formatModifiers(snapshot: {
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}): string {
  return [
    snapshot.metaKey && "Meta",
    snapshot.shiftKey && "Shift",
    snapshot.ctrlKey && "Ctrl",
    snapshot.altKey && "Alt",
  ]
    .filter(Boolean)
    .join(" + ");
}

/** Build the five copyable fields shown by it-tools. Empty when no event yet. */
export function buildKeycodeFields(
  snapshot: KeyEventSnapshot | null | undefined,
): KeycodeField[] {
  if (!snapshot) {
    return [];
  }

  return [
    {
      id: "key",
      label: "Key",
      value: snapshot.key,
      placeholder: "Key name...",
    },
    {
      id: "keycode",
      label: "Keycode",
      value: String(snapshot.keyCode),
      placeholder: "Keycode...",
    },
    {
      id: "code",
      label: "Code",
      value: snapshot.code,
      placeholder: "Code...",
    },
    {
      id: "location",
      label: "Location",
      value: String(snapshot.location),
      placeholder: "Code...",
    },
    {
      id: "modifiers",
      label: "Modifiers",
      value: formatModifiers(snapshot),
      placeholder: "None",
    },
  ];
}

/** Extract a plain snapshot from a KeyboardEvent (testable, SSR-safe). */
export function snapshotFromKeyboardEvent(event: {
  key: string;
  keyCode: number;
  code: string;
  location: number;
  metaKey: boolean;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
}): KeyEventSnapshot {
  return {
    key: event.key,
    keyCode: event.keyCode,
    code: event.code,
    location: event.location,
    metaKey: event.metaKey,
    shiftKey: event.shiftKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
  };
}
