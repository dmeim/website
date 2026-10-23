import { Fragment, type ComponentPropsWithRef } from "react";
import { cx } from "@/ui/lib/cx";

export type KbdProps = ComponentPropsWithRef<"kbd"> & {
  keys?: string[];
};

export function Kbd({ keys, className, children, ...rest }: KbdProps) {
  if (keys && keys.length > 0) {
    return (
      <kbd className={cx("ui-kbd", className)} data-combo="" {...rest}>
        {keys.map((key, i) => (
          <Fragment key={`${key}-${i}`}>
            {i > 0 && <span className="ui-kbd__sep" aria-hidden="true">+</span>}
            <kbd className="ui-kbd__key">{key}</kbd>
          </Fragment>
        ))}
      </kbd>
    );
  }
  return (
    <kbd className={cx("ui-kbd", className)} {...rest}>
      {children}
    </kbd>
  );
}
