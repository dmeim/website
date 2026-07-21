const NOISE_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

type GrainProps = {
  opacity?: number;
  className?: string;
};

export function Grain({ opacity = 0.05, className }: GrainProps) {
  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        pointerEvents: "none",
        opacity,
        backgroundImage: NOISE_URI,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
        mixBlendMode: "overlay",
      }}
    />
  );
}

export type { GrainProps };
