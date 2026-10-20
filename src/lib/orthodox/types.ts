export type OrthodoxImage = {
  /** Stable id: `<collection>/<file stem>`. */
  id: string;
  src: string;
  /** Small preview for pickers. */
  thumb: string;
  title: string;
  collection: string;
};

export type OrthodoxCollection = {
  id: string;
  label: string;
  count: number;
};

export type WallBackground = {
  id: string;
  label: string;
  /** CSS `background` shorthand for the wall. */
  css: string;
};

export type Box = { x: number; y: number; w: number; h: number };

export type Size = { width: number; height: number };
