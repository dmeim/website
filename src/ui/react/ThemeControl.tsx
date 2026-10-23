import { useEffect, useState, type HTMLAttributes } from "react";
import { Icon } from "@/ui/icons";
import { cx } from "@/ui/lib/cx";
import { useStableId } from "@/ui/lib/ids";
import {
  getThemePreference,
  isThemePreference,
  nextPreference,
  setThemePreference,
  subscribeTheme,
  type ThemePreference,
} from "@/ui/lib/theme";
import { SegmentedControl } from "./SegmentedControl";

export type ThemeControlProps = Omit<HTMLAttributes<HTMLDivElement>, "onChange"> & {
  appearance?: "segmented" | "cycle" | "text";
  size?: "sm" | "md";
};

const options = [
  { value: "light", label: "Light", icon: "sun" as const },
  { value: "system", label: "System", icon: "circle-half" as const },
  { value: "dark", label: "Dark", icon: "moon" as const },
];

function useThemePreference(): ThemePreference | undefined {
  const [preference, setPreference] = useState<ThemePreference>();
  useEffect(() => {
    setPreference(getThemePreference());
    return subscribeTheme((detail) => setPreference(detail.preference));
  }, []);
  return preference;
}

export function ThemeControl({ appearance = "segmented", size = "md", className, id, ...rest }: ThemeControlProps) {
  const preference = useThemePreference();
  const name = useStableId(undefined, "theme");

  if (appearance === "segmented") {
    return (
      <SegmentedControl
        id={id}
        className={cx("ui-theme-control", className)}
        name={name}
        label="Theme"
        labelHidden
        size={size}
        options={options.map((option) => ({ ...option, iconOnly: true }))}
        value={preference ?? ""}
        onChange={(value) => isThemePreference(value) && setThemePreference(value)}
        data-appearance="segmented"
      />
    );
  }

  if (appearance === "cycle") {
    const current = preference ?? "system";
    const option = options.find((item) => item.value === current) ?? options[1];
    return (
      <div {...rest} id={id} className={cx("ui-theme-control", className)} data-appearance="cycle" data-size={size} data-value={current}>
        <button
          type="button"
          className="ui-icon-button"
          data-variant="ghost"
          data-size={size}
          aria-label={`Theme: ${current}. Switch to ${nextPreference(current)}`}
          onClick={() => setThemePreference(nextPreference(current))}
        >
          <Icon name={option.icon} className="ui-icon-button__icon" />
        </button>
      </div>
    );
  }

  return (
    <div {...rest} id={id} className={cx("ui-theme-control", className)} data-appearance="text" data-size={size} role="group" aria-label="Theme">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="ui-theme-control__text"
          aria-pressed={preference === option.value}
          onClick={() => setThemePreference(option.value as ThemePreference)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
