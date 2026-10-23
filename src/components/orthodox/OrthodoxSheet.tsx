import { motion } from "framer-motion";
import type { ComponentProps } from "react";

import { cx } from "@/ui/lib/cx";
import { Drawer } from "@/ui/react";

type OrthodoxSheetProps = Omit<
  ComponentProps<typeof Drawer>,
  "open" | "side" | "modal"
>;

/** Non-modal end drawer; the wrapper keeps the AnimatePresence enter/exit. */
export function OrthodoxSheet({ className, ...rest }: OrthodoxSheetProps) {
  return (
    <motion.div
      className="ow-sheet"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25 }}
    >
      <Drawer
        {...rest}
        open
        side="end"
        modal={false}
        width="24rem"
        className={cx("ow-panel", className)}
      />
    </motion.div>
  );
}
