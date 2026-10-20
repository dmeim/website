import { motion } from "framer-motion";
import { Check, Plus } from "lucide";

import { LucideIcon } from "@/components/chat/LucideIcon";
import { MAX_CARDS } from "@/lib/orthodox/custom";

type EditToolbarProps = {
  count: number;
  onAdd: () => void;
  onDone: () => void;
};

export function EditToolbar({ count, onAdd, onDone }: EditToolbarProps) {
  return (
    <motion.div
      className="ow-toolbar"
      role="toolbar"
      aria-label="Arrange wall"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      onClick={(event) => event.stopPropagation()}
    >
      <span className="ow-toolbar__count">
        {count} / {MAX_CARDS} cards
      </span>
      <button
        type="button"
        className="ow-toolbar__btn"
        onClick={onAdd}
        disabled={count >= MAX_CARDS}
      >
        <LucideIcon icon={Plus} size={15} />
        Add card
      </button>
      <button
        type="button"
        className="ow-toolbar__btn ow-toolbar__btn--done"
        onClick={onDone}
      >
        <LucideIcon icon={Check} size={15} />
        Done
      </button>
    </motion.div>
  );
}
