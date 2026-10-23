import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export interface FormGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | "auto";
  gap?: "sm" | "md" | "lg";
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

export function FormGrid({ columns = 2, gap = "md", className, children, ...rest }: FormGridProps) {
  return (
    <div {...rest} className={cx("ui-form-grid", className)} data-columns={columns} data-gap={gap}>
      {children}
    </div>
  );
}
