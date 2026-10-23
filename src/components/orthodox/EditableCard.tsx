import type { CustomCard } from "@/lib/orthodox/custom";
import type { BoardBorder } from "@/lib/orthodox/settings";
import type { Box, OrthodoxImage, Size } from "@/lib/orthodox/types";
import { Icon } from "@/ui/icons";
import { IconButton } from "@/ui/react";

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

const LOCK_ICONS = {
  any: "shuffle",
  collection: "stack",
  icon: "push-pin",
} as const;

/** Stable 0/1 from the card id, so a card keeps its tilt direction. */
function phaseOf(id: string): 0 | 1 {
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return sum % 2 === 0 ? 0 : 1;
}

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
        phase: phaseOf(card.id),
        handlers,
      }}
    >
      <div className="ow-card">
        <IconButton
          icon="x"
          label="Remove card"
          variant="primary"
          size="sm"
          tooltip={false}
          className="ow-card__remove"
          tabIndex={-1}
          onClick={onRemove}
        />
        <button
          type="button"
          className="ui-badge ow-card__lock"
          data-tone={lock.missing ? "danger" : card.lock.kind === "any" ? "neutral" : "accent"}
          data-variant="solid"
          data-size="md"
          data-kind={card.lock.kind}
          data-missing={lock.missing || undefined}
          tabIndex={-1}
          onClick={onPick}
        >
          <Icon
            name={LOCK_ICONS[card.lock.kind]}
            weight="bold"
            className="ui-badge__icon"
          />
          <span className="ow-card__lock-text">{lock.text}</span>
        </button>
        <span className="ow-card__resize" data-resize aria-hidden="true" />
      </div>
    </IconBoard>
  );
}
