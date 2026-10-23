import { useState } from "react";
import {
  Checkbox,
  ColorInput,
  Field,
  FileDrop,
  Fieldset,
  FormGrid,
  Input,
  RadioGroup,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  Textarea,
  type SliderValue,
} from "@/ui/react/groups/forms";

const longLabel = "A deliberately long label that keeps going to show how wrapping behaves inside narrow columns";
const languages = [
  { value: "ts", label: "TypeScript", group: "Typed" },
  { value: "rs", label: "Rust", group: "Typed" },
  { value: "js", label: "JavaScript", group: "Dynamic" },
  { value: "py", label: "Python", group: "Dynamic", disabled: true },
];
const density = [
  { value: "compact", label: "Compact" },
  { value: "default", label: "Default" },
  { value: "relaxed", label: "Relaxed" },
];

function Specimens({ theme }: { theme: string }) {
  const [search, setSearch] = useState("phosphor");
  const [density1, setDensity] = useState("default");
  const [words, setWords] = useState<SliderValue>([5, 20]);
  const [notify, setNotify] = useState(true);
  const [mixed, setMixed] = useState(true);

  return (
    <div style={{ display: "grid", gap: "var(--ui-space-lg)" }}>
      <h4 className="ui-showcase-sub">Input</h4>
      <FormGrid columns={1} gap="sm">
        <Input label="Name" placeholder="Ada Lovelace" hint="As it appears on your profile." />
        <Input label="Email" type="email" placeholder="you@example.com" required />
        <Input label="Website" type="url" optional iconStart="globe" placeholder="https://" />
        <Input
          label={`Search (controlled: "${search}")`}
          type="search"
          iconStart="magnifying-glass"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Input label="Amount" type="number" suffix="ms" defaultValue="250" mono />
        <Input label="Password" type="password" revealable defaultValue="hunter2" />
        <Input label="Clearable" clearable defaultValue="Clear me" />
        <Input label="Invalid" defaultValue="not-an-email" error="Enter a valid email address." />
        <Input label="Output (readonly)" readOnly mono value="sha256:9f86d081884c7d65" />
        <Input label="Disabled" disabled defaultValue="Can't touch this" />
        <Input label={longLabel} placeholder="Long label overflow" />
        <Input label="With trailing" defaultValue="abc" trailing={<span style={{ fontSize: "var(--ui-fs-xs)", color: "var(--ui-text-muted)" }}>3 chars</span>} />
        <Input label="Inline layout" layout="inline" placeholder="Label column" />
        <Input label="Hidden label" labelHidden placeholder="Label is visually hidden" />
        <div style={{ display: "grid", gap: "var(--ui-space-xs)" }}>
          <Input size="sm" placeholder="Small" aria-label="Small" />
          <Input size="md" placeholder="Medium" aria-label="Medium" />
          <Input size="lg" placeholder="Large" aria-label="Large" />
        </div>
      </FormGrid>

      <h4 className="ui-showcase-sub">Textarea</h4>
      <Textarea label="Message" placeholder="Say hello" rows={3} hint="Markdown is supported." />
      <Textarea label="Auto-grow (2–6 rows)" autoGrow minRows={2} maxRows={6} placeholder="Type several lines" />
      <Textarea label="Invalid" rows={2} error="Message is required." />
      <Textarea label="Output" readOnly mono rows={2} value={'{\n  "ok": true\n}'} />
      <Textarea label="No resize, disabled" resize="none" rows={2} disabled defaultValue="Disabled" />

      <h4 className="ui-showcase-sub">Select</h4>
      <Select label="Language" options={languages} defaultValue="ts" />
      <Select label="Invalid" options={languages} error="Pick a language." />
      <Select label="Disabled" disabled options={languages} />
      <Select size="sm" aria-label="Children select">
        <option>Children option</option>
        <option>Another</option>
      </Select>

      <h4 className="ui-showcase-sub">Checkbox and Switch</h4>
      <Checkbox label="Send me a copy" defaultChecked />
      <Checkbox label="Unchecked" description="Optional description line in muted text." />
      <Checkbox label="Indeterminate (click to clear)" indeterminate={mixed} onChange={() => setMixed(false)} />
      <Checkbox label="Invalid" invalid />
      <Checkbox label="Disabled checked" disabled defaultChecked />
      <Checkbox label={longLabel} />
      <Switch label={`Email notifications (${notify ? "on" : "off"})`} checked={notify} onChange={(event) => setNotify(event.target.checked)} />
      <Switch label="Label at start" labelPosition="start" description="Thumb slides on toggle." />
      <Switch label="Disabled" disabled />

      <h4 className="ui-showcase-sub">RadioGroup</h4>
      <RadioGroup
        name={`r-plan-${theme}`}
        legend="Plan"
        defaultValue="pro"
        options={[
          { value: "free", label: "Free" },
          { value: "pro", label: "Pro", description: "Everything in Free, plus more." },
          { value: "team", label: "Team", disabled: true },
        ]}
      />
      <RadioGroup
        name={`r-dir-${theme}`}
        legend="Direction"
        orientation="horizontal"
        defaultValue="ltr"
        options={[
          { value: "ltr", label: "Left to right" },
          { value: "rtl", label: "Right to left" },
        ]}
      />

      <h4 className="ui-showcase-sub">SegmentedControl</h4>
      <SegmentedControl name={`r-density-${theme}`} label={`Density (controlled: ${density1})`} options={density} value={density1} onChange={setDensity} />
      <SegmentedControl
        name={`r-theme-${theme}`}
        label="Theme"
        labelHidden
        size="sm"
        defaultValue="system"
        options={[
          { value: "light", label: "Light", icon: "sun", iconOnly: true },
          { value: "system", label: "System", icon: "circle-half", iconOnly: true },
          { value: "dark", label: "Dark", icon: "moon", iconOnly: true },
        ]}
      />
      <SegmentedControl
        name={`r-colour-${theme}`}
        label="Border colour"
        defaultValue="gold"
        options={[
          { value: "gold", label: "Gold", swatch: "#b8862f" },
          { value: "red", label: "Red", swatch: "#a8322d" },
          { value: "blue", label: "Blue", swatch: "#2d5aa8" },
        ]}
      />
      <SegmentedControl
        name={`r-uneven-${theme}`}
        label="Measured (equal=false)"
        equal={false}
        defaultValue="medium"
        options={[
          { value: "low", label: "Low" },
          { value: "medium", label: "Medium thinking" },
          { value: "high", label: "High" },
        ]}
      />
      <SegmentedControl name={`r-fill-${theme}`} label="Fill indicator" indicator="fill" size="lg" options={density} defaultValue="compact" />
      <SegmentedControl
        name={`r-none-${theme}`}
        label="No selection, one disabled"
        options={[...density.slice(0, 2), { value: "x", label: "Off", disabled: true }]}
      />

      <h4 className="ui-showcase-sub">Slider</h4>
      <Slider label="Length" min={4} max={64} defaultValue={24} showValue />
      <Slider label="Opacity" min={0} max={100} step={10} defaultValue={40} showValue formatValue={(n) => `${n}%`} marks={[0, 50, 100]} />
      <Slider label="Words" min={1} max={50} value={words} onChange={setWords} showValue />
      <Slider label="Disabled" min={0} max={10} defaultValue={3} disabled showValue />

      <h4 className="ui-showcase-sub">Field, FormGrid and Fieldset</h4>
      <Fieldset legend="Export" description="Settings applied to the downloaded file.">
        <FormGrid columns="auto" gap="sm">
          <Input label="Width" suffix="px" defaultValue="1200" />
          <Input label="Height" suffix="px" defaultValue="630" />
          <Select
            label="Format"
            options={[
              { value: "png", label: "PNG" },
              { value: "svg", label: "SVG" },
            ]}
          />
        </FormGrid>
      </Fieldset>
      <FormGrid columns={2}>
        <Input label="First" />
        <Input label="Last" />
        <Field label="Custom child (span full)" span="full" htmlFor={`r-raw-${theme}`} hint="Field wraps any control.">
          <input id={`r-raw-${theme}`} className="ui-input__control" style={{ borderBottom: "1px solid var(--ui-line)" }} />
        </Field>
      </FormGrid>
    </div>
  );
}

function PickerSpecimens({ theme }: { theme: string }) {
  const [color, setColor] = useState("#8a6d3b");
  const [files, setFiles] = useState<string[]>([]);
  return (
    <div style={{ display: "grid", gap: "var(--ui-space-md)" }}>
      <h4 className="ui-showcase-sub">ColorInput</h4>
      <ColorInput id={`r-color-${theme}`} label="Foreground" value={color} onChange={setColor} hint={`Value: ${color}`} />
      <ColorInput id={`r-color2-${theme}`} label="Swatch only" value={color} onChange={setColor} allowText={false} />
      <ColorInput id={`r-color3-${theme}`} label="Invalid" value="#a3442c" onChange={() => {}} error="Contrast too low." />
      <h4 className="ui-showcase-sub">FileDrop</h4>
      <FileDrop label="Upload a file" hint="Any file, read locally." onFiles={(list) => setFiles(list.map((f) => f.name))}>
        {files.length > 0 && <p style={{ margin: 0 }}>{files.join(", ")}</p>}
      </FileDrop>
      <FileDrop label="Certificates" multiple compact accept=".pem,.crt" onFiles={(list) => setFiles(list.map((f) => f.name))} />
      <FileDrop label="Disabled" disabled onFiles={() => {}} error="Uploads are disabled." />
    </div>
  );
}

export function FormsShowcase() {
  return (
    <div className="ui-showcase-pair">
      {(["light", "dark"] as const).map((theme) => (
        <div key={theme} className="ui-showcase-pair__col" data-theme={theme}>
          <p className="ui-showcase-pair__label">{theme === "light" ? "Light" : "Dark"}</p>
          <Specimens theme={theme} />
          <PickerSpecimens theme={theme} />
        </div>
      ))}
    </div>
  );
}
