import { useCallback, useEffect, useMemo, useState } from "react";

import {
  cardBox,
  cardsFromBoxes,
  type CustomCard,
} from "@/lib/orthodox/custom";
import { computeLayout } from "@/lib/orthodox/layout";
import {
  fillCards,
  pickImages,
  poolFor,
  resizeSelection,
  rotateCard,
  rotateOne,
  type Assignment,
} from "@/lib/orthodox/selection";
import type { ScreensaverSettings } from "@/lib/orthodox/settings";
import type { Box, OrthodoxImage, Size } from "@/lib/orthodox/types";

export type WallBoard = {
  key: string;
  box: Box;
  /** Empty only for a custom card whose pool has nothing to show. */
  image?: OrthodoxImage;
  card?: CustomCard;
};

/** Which image hangs where, for preset layouts and custom cards alike. */
export function useWallBoards(
  images: OrthodoxImage[],
  settings: ScreensaverSettings,
  size: Size,
  paused: boolean,
) {
  const pool = useMemo(
    () => poolFor(images, settings.collection),
    [images, settings.collection],
  );
  const custom = settings.layout === "custom";
  const cards = settings.customCards;
  const [hanging, setHanging] = useState<OrthodoxImage[]>([]);
  const [assigned, setAssigned] = useState<Assignment>({});

  useEffect(() => {
    if (custom) return;
    setHanging((current) => resizeSelection(current, pool, settings.count));
  }, [custom, pool, settings.count]);

  useEffect(() => {
    if (!custom) return;
    setAssigned((current) => fillCards(cards, current, images, pool));
  }, [custom, cards, images, pool]);

  useEffect(() => {
    if (paused || settings.rotationSeconds === 0) return;
    const id = window.setInterval(() => {
      if (custom) {
        setAssigned((current) => rotateCard(cards, current, images, pool));
      } else {
        setHanging((current) => rotateOne(current, pool));
      }
    }, settings.rotationSeconds * 1000);
    return () => window.clearInterval(id);
  }, [paused, settings.rotationSeconds, custom, cards, images, pool]);

  const boards = useMemo<WallBoard[]>(() => {
    if (size.width <= 0 || size.height <= 0) return [];
    if (settings.layout === "custom") {
      return cards.map((card) => ({
        key: card.id,
        box: cardBox(card, size),
        image: assigned[card.id],
        card,
      }));
    }
    const boxes = computeLayout(settings.layout, hanging.length, size);
    return hanging.flatMap((image, i) =>
      boxes[i] ? [{ key: String(i), box: boxes[i], image }] : [],
    );
  }, [cards, assigned, settings.layout, hanging, size]);

  const shuffle = useCallback(() => {
    if (custom) setAssigned(fillCards(cards, {}, images, pool));
    else setHanging(pickImages(pool, settings.count));
  }, [custom, cards, images, pool, settings.count]);

  /** Snap the wall as it hangs now into custom cards, keeping each image in place. */
  const toCards = useCallback((): CustomCard[] => {
    const seeded = cardsFromBoxes(
      boards.map((board) => board.box),
      size,
    );
    setAssigned(
      Object.fromEntries(
        seeded.flatMap((card, i) => {
          const image = boards[i]?.image;
          return image ? [[card.id, image]] : [];
        }),
      ),
    );
    return seeded;
  }, [boards, size]);

  return { boards, pool, shuffle, toCards };
}
