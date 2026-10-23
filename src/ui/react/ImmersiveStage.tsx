import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";

export type ImmersiveStageProps = {
  label: string;
  idle?: boolean;
  toolbar?: ReactNode;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function ImmersiveStage({ label, idle = false, toolbar, children, className, ...rest }: ImmersiveStageProps) {
  return (
    <div
      {...rest}
      role="region"
      aria-label={label}
      className={cx("ui-immersive-stage", className)}
      data-idle={idle ? "true" : undefined}
    >
      <div className="ui-immersive-stage__canvas">{children}</div>
      {toolbar && <div className="ui-immersive-stage__controls">{toolbar}</div>}
    </div>
  );
}
