import { useRef, useState, type DragEvent, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { cx } from "@/ui/lib/cx";
import { describedBy } from "@/ui/lib/field";
import { useStableId } from "@/ui/lib/ids";
import { Button } from "./Button";
import { Field } from "./Field";

export type FileDropProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  label: string;
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  hint?: ReactNode;
  error?: ReactNode;
  disabled?: boolean;
  children?: ReactNode;
  compact?: boolean;
  ref?: Ref<HTMLDivElement>;
};

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function FileDrop({
  label,
  accept,
  multiple,
  onFiles,
  hint,
  error,
  disabled,
  children,
  compact,
  id,
  className,
  ...rest
}: FileDropProps) {
  const inputId = useStableId(id, "file");
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const emit = (list: FileList | null) => {
    const files = list ? Array.from(list) : [];
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  };

  const dropHandlers = compact || disabled
    ? {}
    : {
        onDragEnter: (event: DragEvent) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        },
        onDragOver: (event: DragEvent) => {
          if (!hasFiles(event)) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: () => {
          depth.current = Math.max(0, depth.current - 1);
          if (depth.current === 0) setDragging(false);
        },
        onDrop: (event: DragEvent) => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          emit(event.dataTransfer.files);
        },
      };

  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} labelHidden={!compact}>
      <div
        {...rest}
        {...dropHandlers}
        className={cx("ui-file-drop", className)}
        data-compact={compact ? "true" : undefined}
        data-state={dragging ? "dragging" : "idle"}
        data-disabled={disabled ? "true" : undefined}
        data-invalid={error ? "true" : undefined}
      >
        <input
          ref={input}
          id={inputId}
          type="file"
          className="ui-visually-hidden"
          tabIndex={-1}
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-describedby={describedBy(inputId, hint, error)}
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            emit(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        {!compact && (
          <p className="ui-file-drop__text">
            <span className="ui-file-drop__title">{label}</span>
            <span className="ui-file-drop__sub">Drag and drop {multiple ? "files" : "a file"} here, or</span>
          </p>
        )}
        <Button
          iconStart="upload-simple"
          size={compact ? "md" : "sm"}
          disabled={disabled}
          aria-describedby={describedBy(inputId, hint, error)}
          onClick={() => input.current?.click()}
        >
          {multiple ? "Choose files" : "Choose file"}
        </Button>
        {children != null && <div className="ui-file-drop__preview">{children}</div>}
      </div>
    </Field>
  );
}
