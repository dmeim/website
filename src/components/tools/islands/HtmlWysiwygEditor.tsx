import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useMemo, useState } from "react";

import type { IslandIconName as IconName } from "@/ui/icons";
import { CopyButton, IconButton, OutputField, Panel, ToolFrame, Toolbar } from "@/ui/react";
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
      icon: IconName;
      title: string;
      action: (editor: Editor) => void;
      isActive?: (editor: Editor) => boolean;
    }
  | { type: "divider" };

const MENU_ITEMS: MenuItem[] = [
  {
    type: "button",
    icon: "text-b",
    title: "Bold",
    action: (editor) => editor.chain().focus().toggleBold().run(),
    isActive: (editor) => editor.isActive("bold"),
  },
  {
    type: "button",
    icon: "text-italic",
    title: "Italic",
    action: (editor) => editor.chain().focus().toggleItalic().run(),
    isActive: (editor) => editor.isActive("italic"),
  },
  {
    type: "button",
    icon: "text-strikethrough",
    title: "Strike",
    action: (editor) => editor.chain().focus().toggleStrike().run(),
    isActive: (editor) => editor.isActive("strike"),
  },
  {
    type: "button",
    icon: "code",
    title: "Inline code",
    action: (editor) => editor.chain().focus().toggleCode().run(),
    isActive: (editor) => editor.isActive("code"),
  },
  { type: "divider" },
  {
    type: "button",
    icon: "text-h-one",
    title: "Heading 1",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 1 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 1 }),
  },
  {
    type: "button",
    icon: "text-h-two",
    title: "Heading 2",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 2 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 2 }),
  },
  {
    type: "button",
    icon: "text-h-three",
    title: "Heading 3",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 3 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 3 }),
  },
  {
    type: "button",
    icon: "text-h-four",
    title: "Heading 4",
    action: (editor) =>
      editor.chain().focus().toggleHeading({ level: 4 }).run(),
    isActive: (editor) => editor.isActive("heading", { level: 4 }),
  },
  { type: "divider" },
  {
    type: "button",
    icon: "list-bullets",
    title: "Bullet list",
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
    isActive: (editor) => editor.isActive("bulletList"),
  },
  {
    type: "button",
    icon: "list-numbers",
    title: "Ordered list",
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    isActive: (editor) => editor.isActive("orderedList"),
  },
  {
    type: "button",
    icon: "code-block",
    title: "Code block",
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive("codeBlock"),
  },
  {
    type: "button",
    icon: "quotes",
    title: "Blockquote",
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive("blockquote"),
  },
  { type: "divider" },
  {
    type: "button",
    icon: "arrow-elbow-down-left",
    title: "Hard break",
    action: (editor) => editor.chain().focus().setHardBreak().run(),
  },
  {
    type: "button",
    icon: "eraser",
    title: "Clear format",
    action: (editor) =>
      editor.chain().focus().clearNodes().unsetAllMarks().run(),
  },
  {
    type: "button",
    icon: "arrow-counter-clockwise",
    title: "Undo",
    action: (editor) => editor.chain().focus().undo().run(),
  },
  {
    type: "button",
    icon: "arrow-clockwise",
    title: "Redo",
    action: (editor) => editor.chain().focus().redo().run(),
  },
];

function MenuBar({ editor }: { editor: Editor }) {
  return (
    <Toolbar label="Formatting" className="wysiwyg-toolbar">
      {MENU_ITEMS.map((item, index) => {
        if (item.type === "divider") {
          return <span key={`divider-${index}`} className="wysiwyg-toolbar__divider" aria-hidden="true" />;
        }

        const active = item.isActive?.(editor) ?? false;
        return (
          <IconButton
            key={item.title}
            icon={item.icon}
            label={item.title}
            size="sm"
            pressed={item.isActive ? active : undefined}
            onClick={() => item.action(editor)}
          />
        );
      })}
    </Toolbar>
  );
}

export default function HtmlWysiwygEditor() {
  const [html, setHtml] = useState(DEFAULT_HTML);

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

  return (
    <ToolFrame layout="split">
      <Panel
        title="Editor"
        titleId="wysiwyg-heading"
        description="Format with the toolbar. Source HTML updates live as you edit."
      >
        <div className="wysiwyg-chrome">
          {editor ? <MenuBar editor={editor} /> : null}
          <div className="wysiwyg-surface">
            <EditorContent editor={editor} />
          </div>
        </div>
      </Panel>

      <Panel
        title="HTML source"
        titleId="wysiwyg-source-heading"
        description="Pretty-printed markup generated from the editor."
        actions={<CopyButton value={formattedHtml} label="Copy HTML" disabled={!formattedHtml} size="sm" />}
      >
        <OutputField
          id="wysiwyg-source"
          label="Source"
          multiline
          rows={16}
          value={formattedHtml}
          placeholder="HTML source appears here"
          className="wysiwyg-source"
          copy={false}
        />
      </Panel>
    </ToolFrame>
  );
}
