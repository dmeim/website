import type { FieldsetHTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";

export interface FieldsetProps extends FieldsetHTMLAttributes<HTMLFieldSetElement> {
  legend: string;
  description?: ReactNode;
  legendHidden?: boolean;
  children?: ReactNode;
  ref?: Ref<HTMLFieldSetElement>;
}

export function Fieldset({ legend, description, legendHidden, id, className, children, ...rest }: FieldsetProps) {
  const baseId = useStableId(id, "fieldset");
  const descId = description ? `${baseId}-description` : undefined;
  return (
    <fieldset {...rest} id={id} className={cx("ui-fieldset", className)} aria-describedby={descId}>
      <legend className={cx("ui-fieldset__legend", legendHidden && "ui-visually-hidden")}>{legend}</legend>
      {description && (
        <p className="ui-fieldset__description" id={descId}>
          {description}
        </p>
      )}
      <div className="ui-fieldset__body">{children}</div>
    </fieldset>
  );
}
