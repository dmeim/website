import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
  cx,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  DEFAULT_HTML,
  formatEditorHtml,
  readStoredHtml,
  writeStoredHtml,
} from "@/lib/tools/html-wysiwyg-editor";

import "./HtmlWysiwygEditor.css";

type MenuItem =
  | {
      type: "button";
      label: string;
      title: string;
      action: (editor: Editor) => void;
      isActive?: (editor: Editor) => boolean;
    }
  | { type: "divider" };

const MENU_ITEMS: MenuItem[] = [
  {
    type: "button",
    label: "B",
    title: "Bold",
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    type: "button",
    label: "I",
    title: "Italic",
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    type: "button",
    label: "S",
    title: "Strike",
    action: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive("strike"),
  },
  {
    type: "button",
    label: "</>",
    title: "Inline code",
    action: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive("code"),
  },
  { type: "divider" },
  {
    type: "button",
    label: "H1",
    title: "Heading 1",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    type: "button",
    label: "H2",
    title: "Heading 2",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    type: "button",
    label: "H3",
    title: "Heading 3",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  {
    type: "button",
    label: "H4",
    title: "Heading 4",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 4 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 4 }),
  },
  { type: "divider" },
  {
    type: "button",
    label: "•",
    title: "Bullet list",
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    type: "button",
    label: "1.",
    title: "Ordered list",
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    type: "button",
    label: "{ }",
    title: "Code block",
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive("codeBlock"),
  },
  {
    type: "button",
    label: "“”",
    title: "Blockquote",
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
  { type: "divider" },
  {
    type: "button",
    label: "↵",
    title: "Hard break",
    action: (editor) => editor.chain().focus().setHardBreak().run(),
  },
  {
    type: "button",
    label: "⌫",
    title: "Clear format",
    action: (editor) =>
      editor.chain().focus().clearNodes().unsetAllMarks().run(),
  },
  {
    type: "button",
    label: "↶",
    title: "Undo",
    action: (editor) => editor.chain().focus().undo().run(),
  },
  {
    type: "button",
    label: "↷",
    title: "Redo",
    action: (editor) => editor.chain().focus().redo().run(),
  },
];

function MenuBar({ editor }: { editor: Editor }) {
  return (
    <div className="wysiwyg-toolbar" role="toolbar" aria-label="Formatting">
      {MENU_ITEMS.map((item, index) => {
        if (item.type === "divider") {
          return (
            <span
              key={`divider-${index}`}
              className="wysiwyg-toolbar__divider"
              aria-hidden="true"
            />
          );
        }

        const active = item.isActive?.(editor) ?? false;
        return (
          <button
            key={item.title}
            type="button"
            className={cx(
              "wysiwyg-toolbar__btn",
              active && "wysiwyg-toolbar__btn--active",
            )}
            title={item.title}
            aria-label={item.title}
            aria-pressed={item.isActive ? active : undefined}
            onClick={() => item.action(editor)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export default function HtmlWysiwygEditor() {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [actionStatus, setActionStatus] = useState("");

  const editor = useEditor(
    {
      extensions: [StarterKit],
      content:
        typeof window !== "undefined" ? readStoredHtml() : DEFAULT_HTML,
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      editorProps: {
        attributes: {
          class: "wysiwyg-prose",
          "aria-label": "WYSIWYG HTML editor",
        },
      },
      onCreate: ({ editor: current }) => {
        setHtml(current.getHTML());
      },
      onUpdate: ({ editor: current }) => {
        const next = current.getHTML();
        setHtml(next);
        writeStoredHtml(next);
      },
    },
    [],
  );

  const formattedHtml = useMemo(() => formatEditorHtml(html), [html]);

  const copyHtml = useCallback(async () => {
    if (!formattedHtml) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(formattedHtml);
      setActionStatus("HTML copied.");
    } catch {
      setActionStatus("Copy failed. Select the source and copy it manually.");
    }
  }, [formattedHtml]);

  return (
    <ToolIsland className="wysiwyg-tool">
      <ToolWorkspace stagger className="wysiwyg-tool__workspace">
        <ToolPanel labelledBy="wysiwyg-heading" className="wysiwyg-tool__panel">
          <ToolSectionHeading
            title="Editor"
            titleId="wysiwyg-heading"
            description={
              <ToolHint>
                Format with the toolbar. Source HTML updates live as you edit.
              </ToolHint>
            }
          />

          <div className="wysiwyg-chrome">
            {editor ? <MenuBar editor={editor} /> : null}
            <div className="wysiwyg-surface">
              <EditorContent editor={editor} />
            </div>
          </div>
        </ToolPanel>

        <ToolPanel
          labelledBy="wysiwyg-source-heading"
          className="wysiwyg-tool__panel"
        >
          <ToolSectionHeading
            title="HTML source"
            titleId="wysiwyg-source-heading"
            description={
              <ToolHint>Pretty-printed markup generated from the editor.</ToolHint>
            }
          />

          <ToolTextarea
            id="wysiwyg-source"
            label="Source"
            full
            code
            readOnly
            rows={16}
            value={formattedHtml}
            placeholder="HTML source appears here"
            className="wysiwyg-source"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyHtml()}
              disabled={!formattedHtml}
            >
              Copy HTML
            </ToolButton>
          </ToolActionRow>

          {actionStatus ? (
            <ToolStatus tone="success">{actionStatus}</ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
