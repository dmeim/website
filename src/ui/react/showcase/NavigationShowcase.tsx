import { useState } from "react";
import { Breadcrumbs, SideNav, ThemeControl, type SideNavSection } from "@/ui/react/groups/navigation";
import { ThemePair } from "./ThemePair";

const stack = { display: "grid", gap: "var(--ui-space-lg)" } as const;

function buildSections(current: string, encodingOpen: boolean): SideNavSection[] {
  const mark = (id: string) => current === id;
  return [
    {
      id: "encoding",
      title: "Encoding",
      count: 3,
      collapsible: true,
      open: encodingOpen,
      items: [
        { id: "base64", href: "#base64", label: "Base64", current: mark("base64") },
        { id: "url", href: "#url", label: "URL encode", current: mark("url") },
        { id: "jwt", href: "#jwt", label: "JWT decoder", badge: "WIP", current: mark("jwt") },
      ],
    },
    {
      id: "text",
      title: "Text",
      count: 2,
      items: [
        { id: "diff", href: "#diff", label: "Diff", current: mark("diff") },
        { id: "case", label: "Case converter", current: mark("case") },
      ],
    },
  ];
}

export function NavigationShowcase() {
  const [current, setCurrent] = useState("base64");
  const [encodingOpen, setEncodingOpen] = useState(true);
  return (
    <ThemePair>
      <div style={stack}>
        <h4 className="ui-showcase-sub">ThemeControl: segmented, cycle, text</h4>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--ui-space-lg)" }}>
          <ThemeControl />
          <ThemeControl appearance="cycle" />
          <ThemeControl appearance="text" size="sm" />
        </div>
        <h4 className="ui-showcase-sub">Breadcrumbs</h4>
        <Breadcrumbs items={[{ label: "Tools", href: "/tools" }, { label: "Text", href: "/tools" }, { label: "Diff" }]} />
        <h4 className="ui-showcase-sub">SideNav: onNavigate (click glides the marker), onToggleSection</h4>
        <SideNav
          label="Demo tools (React)"
          sections={buildSections(current, encodingOpen)}
          header={<span className="ui-side-nav__link">Current: {current}</span>}
          onNavigate={(item, event) => {
            event.preventDefault();
            setCurrent(item.id);
          }}
          onToggleSection={(id, open) => id === "encoding" && setEncodingOpen(open)}
        />
      </div>
    </ThemePair>
  );
}
