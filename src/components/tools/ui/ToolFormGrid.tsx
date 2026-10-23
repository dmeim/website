import type { ReactNode } from "react";
import { Fieldset, FormGrid } from "@/ui/react";

import { cx } from "./cx";

type ToolFormGridProps = {
  children: ReactNode;
  className?: string;
  /** Three-column export options layout. */
  exportLayout?: boolean;
};

export function ToolFormGrid({ children, className, exportLayout = false }: ToolFormGridProps) {
  return (
    <FormGrid className={cx("tool-form-grid", className)} columns={exportLayout ? 3 : 2}>
      {children}
    </FormGrid>
  );
}

type ToolNestedProps = {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
};

export function ToolNested({ children, title, className }: ToolNestedProps) {
  return (
    <Fieldset
      className={cx("tool-nested", className)}
      legend={(title ?? "") as string}
      legendHidden={!title}
    >
      {children}
    </Fieldset>
  );
}
