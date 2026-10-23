import { isValidElement, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { CopyButton } from "./CopyButton";

export type CodeBlockProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  code?: string;
  children?: ReactNode;
  label?: string;
  language?: string;
  copy?: boolean;
  wrap?: boolean;
  maxHeight?: string;
  ref?: Ref<HTMLElement>;
};

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

export function CodeBlock({ code, children, label, language, copy = true, wrap, maxHeight, className, ...rest }: CodeBlockProps) {
  return (
    <figure
      {...rest}
      className={cx("ui-code-block", className)}
      data-language={language}
      data-wrap={wrap ? "true" : undefined}
      data-labelled={label ? "true" : undefined}
    >
      {(label || copy) && (
        <figcaption className="ui-code-block__head">
          {label && <span className="ui-code-block__label">{label}</span>}
          {copy && (
            <CopyButton
              className="ui-code-block__copy"
              appearance="icon"
              size="sm"
              label="Copy code"
              getValue={() => code ?? textOf(children)}
            />
          )}
        </figcaption>
      )}
      <pre className="ui-code-block__pre" style={maxHeight ? { maxHeight } : undefined} tabIndex={maxHeight ? 0 : undefined}>
        <code data-language={language}>{code ?? children}</code>
      </pre>
    </figure>
  );
}
