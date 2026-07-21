import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

type MotionConfigProviderProps = {
  children: ReactNode;
};

export function MotionConfigProvider({ children }: MotionConfigProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

export type { MotionConfigProviderProps };
