import type { InputHTMLAttributes, ReactNode } from "react";
import { Checkbox, Switch } from "@/ui/react";

import { cx } from "./cx";

type ToolCheckProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: ReactNode;
  full?: boolean;
  /** Switch style; still a native checkbox under the hood. */
  toggle?: boolean;
  className?: string;
};

export function ToolCheck({ full = false, toggle = false, className, ...rest }: ToolCheckProps) {
  const classes = cx(full && "tool-check--full", className);
  return toggle ? <Switch {...rest} className={classes} /> : <Checkbox {...rest} className={classes} />;
}
