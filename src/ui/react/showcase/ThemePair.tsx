import type { ReactNode } from "react";

export interface ThemePairProps {
  children: ReactNode;
  className?: string;
}

/** Renders children twice: once in a light and once in a dark theme column. */
export function ThemePair({ children, className }: ThemePairProps) {
  return (
    <div className={className ? `ui-showcase-pair ${className}` : "ui-showcase-pair"}>
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} className="ui-showcase-pair__col" data-theme={theme}>
          <p className="ui-showcase-pair__label">{theme === "light" ? "Light" : "Dark"}</p>
          {children}
        </div>
      ))}
    </div>
  );
}
