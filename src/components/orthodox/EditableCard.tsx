import { Layers, Pin, Shuffle, X } from "lucide";

import { LucideIcon } from "@/components/chat/LucideIcon";
import type { CustomCard } from "@/lib/orthodox/custom";
import type { BoardBorder } from "@/lib/orthodox/settings";
import type { Box, OrthodoxImage, Size } from "@/lib/orthodox/types";

import { IconBoard } from "./IconBoard";
import { useCardGesture } from "./useCardGesture";

type EditableCardProps = {
  card: CustomCard;
  box: Box;
  image?: OrthodoxImage;
  border: BoardBorder;
  size: Size;
  editing: boolean;
  lock: { text: string; missing: boolean };
  onChange: (card: CustomCard) => void;
  onRemove: () => void;
  onPick: () => void;
};

const LOCK_ICONS = { any: Shuffle, collection: Layers, icon: Pin } as const;

/**
 * A custom-wall card. While editing it jiggles and gains remove, lock and
 * resize controls; otherwise it is a plain board.
 */
export function EditableCard({
  card,
  box,
  image,
  border,
  size,
  editing,
  lock,
  onChange,
  onRemove,
  onPick,
}: EditableCardProps) {
  const { active, handlers } = useCardGesture(card, size, {
    onChange,
    onRemove,
    onPick,
  });

  if (!editing) return <IconBoard box={box} image={image} border={border} />;

  return (
    <IconBoard
      box={box}
      image={image}
      border={border}
      edit={{
        label: `Card showing ${lock.text}. Arrow keys move, Shift and arrows resize, Enter chooses what it shows, Delete removes.`,
        dragging: active,
        handlers,
      }}
    >
      <div className="ow-card">
        <button
          type="button"
          className="ow-card__remove"
          aria-label="Remove card"
          tabIndex={-1}
          onClick={onRemove}
        >
          <LucideIcon icon={X} size={14} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          className="ow-card__lock"
          data-kind={card.lock.kind}
          data-missing={lock.missing || undefined}
          tabIndex={-1}
          onClick={onPick}
        >
          <LucideIcon icon={LOCK_ICONS[card.lock.kind]} size={13} />
          <span className="ow-card__lock-text">{lock.text}</span>
        </button>
        <span className="ow-card__resize" data-resize aria-hidden="true" />
      </div>
    </IconBoard>
  );
}
