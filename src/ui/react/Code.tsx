import type { ComponentPropsWithRef } from "react";
import { cx } from "@/ui/lib/cx";

export type CodeProps = ComponentPropsWithRef<"code">;

export function Code({ className, ...rest }: CodeProps) {
  return <code className={cx("ui-code", className)} {...rest} />;
}
