import { useState } from "react";
import { Button, ButtonGroup, IconButton } from "@/ui/react/groups/actions";
import { Dialog, Drawer, Menu, Popover, Tabs } from "@/ui/react/groups/overlays";
import { ThemePair } from "./ThemePair";

const stack = { display: "grid", gap: "var(--ui-space-sm)" } as const;
const tabItems = [
  { id: "encrypt", label: "Encrypt", icon: "lock" as const },
  { id: "decrypt", label: "Decrypt", icon: "lock-open" as const },
  { id: "history", label: "History", badge: "3" },
  { id: "off", label: "Disabled", disabled: true },
];

function Demo() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState<null | "start" | "end" | "bottom">(null);
  const [last, setLast] = useState("nothing yet");
  return (
    <div style={stack}>
      <h4 className="ui-showcase-sub">Dialog (Escape, backdrop click, focus return)</h4>
      <ButtonGroup>
        <Button onClick={() => setDialog(true)}>Open dialog</Button>
      </ButtonGroup>
      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Delete chat?"
        description="This removes the conversation from this device."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDialog(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => setDialog(false)}>
              Delete
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>You can’t undo this.</p>
      </Dialog>
      <h4 className="ui-showcase-sub">Drawer: start (modal), end (non-modal sheet), bottom</h4>
      <ButtonGroup>
        <Button onClick={() => setDrawer("start")}>Start</Button>
        <Button onClick={() => setDrawer("end")}>End sheet</Button>
        <Button onClick={() => setDrawer("bottom")}>Bottom</Button>
      </ButtonGroup>
      <Drawer open={drawer === "start"} onClose={() => setDrawer(null)} side="start" title="Navigation" modal>
        <ButtonGroup>
          <Button onClick={() => setDrawer(null)}>Close</Button>
        </ButtonGroup>
      </Drawer>
      <Drawer open={drawer === "end"} onClose={() => setDrawer(null)} side="end" title="Settings" modal={false} width="22rem">
        <p style={{ margin: 0 }}>Non-modal: the page stays interactive.</p>
      </Drawer>
      <Drawer open={drawer === "bottom"} onClose={() => setDrawer(null)} side="bottom" title="Details" modal>
        <p style={{ margin: 0 }}>Bottom sheet.</p>
      </Drawer>
      <h4 className="ui-showcase-sub">Popover and Menu</h4>
      <ButtonGroup>
        <Popover label="Model settings" trigger={<Button iconEnd="caret-down">Settings</Button>}>
          <p style={{ margin: 0, fontSize: "var(--ui-fs-sm)" }}>Temperature, max tokens…</p>
        </Popover>
        <Menu
          label="Attach"
          trigger={<IconButton icon="plus" label="Attach" tooltip={false} />}
          items={[
            { id: "images", label: "Images", icon: "images", onSelect: () => setLast("Images") },
            { id: "file", label: "File", icon: "file", onSelect: () => setLast("File"), shortcut: ["⌘", "O"] },
            { id: "library", label: "Library", icon: "books", onSelect: () => setLast("Library") },
            { id: "off", label: "Disabled", onSelect: () => undefined, disabled: true },
            { id: "delete", label: "Delete", icon: "trash", tone: "danger", onSelect: () => setLast("Delete") },
          ]}
        />
        <Popover label="Top end" placement="top-end" trigger={<Button>top-end</Button>}>
          Anchored above.
        </Popover>
      </ButtonGroup>
      <p style={{ margin: 0, fontSize: "var(--ui-fs-sm)" }}>Last menu choice: {last}</p>
      <h4 className="ui-showcase-sub">Tabs (auto and manual activation)</h4>
      <Tabs label="Mode" items={tabItems} renderPanel={(id) => <p style={{ margin: 0 }}>Panel: {id}</p>} />
      <Tabs
        label="Manual"
        activation="manual"
        items={tabItems.slice(0, 3)}
        defaultValue="decrypt"
        renderPanel={(id) => <p style={{ margin: 0 }}>Manual panel: {id}</p>}
      />
    </div>
  );
}

export function OverlaysShowcase() {
  return (
    <ThemePair>
      <Demo />
    </ThemePair>
  );
}
