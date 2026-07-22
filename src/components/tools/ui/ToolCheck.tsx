import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "./cx";

type ToolCheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  full?: boolean;
  /** Visual switch style; still a native checkbox under the hood. */
  toggle?: boolean;
  className?: string;
};

export function ToolCheck({
  label,
  id,
  full = false,
  toggle = false,
  className,
  ...rest
}: ToolCheckProps) {
  return (
    <label
      className={cx(
        toggle ? "tool-toggle" : "tool-check",
        full && (toggle ? "tool-toggle--full" : "tool-check--full"),
        className,
      )}
      htmlFor={id}
    >
      <input id={id} type="checkbox" {...rest} />
      {toggle ? <span className="tool-toggle__track" aria-hidden="true" /> : null}
      <span className={toggle ? "tool-toggle__label" : undefined}>{label}</span>
    </label>
  );
}
