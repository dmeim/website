import { m } from "framer-motion";

import { MAX_CARDS } from "@/lib/orthodox/custom";
import { Button, Toolbar } from "@/ui/react";

type EditToolbarProps = {
  count: number;
  onAdd: () => void;
  onDone: () => void;
};

export function EditToolbar({ count, onAdd, onDone }: EditToolbarProps) {
  // Opacity only: a transform on this wrapper would re-anchor the floating toolbar.
  return (
    <m.div
      className="ow-toolbar-fade"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Toolbar
        label="Arrange wall"
        placement="floating-top"
        className="ow-toolbar"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ow-toolbar__count">
          {count} / {MAX_CARDS} cards
        </span>
        <Button
          size="sm"
          variant="ghost"
          iconStart="plus"
          onClick={onAdd}
          disabled={count >= MAX_CARDS}
        >
          Add card
        </Button>
        <Button size="sm" variant="primary" iconStart="check" onClick={onDone}>
          Done
        </Button>
      </Toolbar>
    </m.div>
  );
}
