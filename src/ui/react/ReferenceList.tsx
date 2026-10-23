import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { EmptyState, type EmptyStateProps } from "./EmptyState";
import { Input } from "./Input";

export type ReferenceListProps = {
  searchLabel: string;
  query: string;
  onQueryChange: (q: string) => void;
  count?: number;
  empty?: EmptyStateProps;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
} & Omit<HTMLAttributes<HTMLDivElement>, "children">;

export function ReferenceList({ searchLabel, query, onQueryChange, count, empty, children, className, ...rest }: ReferenceListProps) {
  return (
    <div {...rest} className={cx("ui-reference-list", className)}>
      <div className="ui-reference-list__search">
        <Input
          type="search"
          label={searchLabel}
          labelHidden
          placeholder={searchLabel}
          iconStart="magnifying-glass"
          clearable
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {count !== undefined && (
          <p className="ui-reference-list__count" aria-live="polite">
            {count} {count === 1 ? "result" : "results"}
          </p>
        )}
      </div>
      <div className="ui-reference-list__body">{count === 0 && empty ? <EmptyState {...empty} /> : children}</div>
    </div>
  );
}
