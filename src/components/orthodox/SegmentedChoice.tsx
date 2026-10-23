import { SegmentedControl } from "@/ui/react";

type Option<T extends string> = { value: T; label: string; swatch?: string };

type SegmentedChoiceProps<T extends string> = {
  legend: string;
  name: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedChoice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: SegmentedChoiceProps<T>) {
  return (
    <SegmentedControl
      className="ow-segments"
      name={name}
      label={legend}
      size="sm"
      equal={false}
      options={[...options]}
      value={value}
      onChange={(next) => onChange(next as T)}
    />
  );
}
