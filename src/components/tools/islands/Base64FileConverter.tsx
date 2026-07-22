import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { downloadDataUrl } from "@/lib/tools/download";
import {
  buildDownloadFromBase64,
  fileToBase64DataUrl,
  isValidBase64,
  resolvePreviewImageSrc,
  suggestExtensionFromBase64,
} from "@/lib/tools/base64-file-converter";

import "./Base64FileConverter.css";

export default function Base64FileConverter() {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState("file");
  const [fileExtension, setFileExtension] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [decodeStatus, setDecodeStatus] = useState("");

  const [fileBase64, setFileBase64] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragging, setDragging] = useState(false);

  const trimmedBase64Input = base64Input.trim();
  const base64InputInvalid =
    trimmedBase64Input !== "" && !isValidBase64(trimmedBase64Input);
  const canUseBase64 =
    trimmedBase64Input !== "" && !base64InputInvalid;

  useEffect(() => {
    setFileExtension((current) =>
      suggestExtensionFromBase64(base64Input, current),
    );
    setPreviewSrc("");
    setDecodeStatus("");
  }, [base64Input]);

  const previewImage = useCallback(() => {
    if (!canUseBase64) {
      return;
    }

    try {
      setPreviewSrc(resolvePreviewImageSrc(trimmedBase64Input));
      setDecodeStatus("");
    } catch {
      setPreviewSrc("");
      setDecodeStatus("Could not preview this Base64 as an image.");
    }
  }, [canUseBase64, trimmedBase64Input]);

  const downloadFile = useCallback(() => {
    if (!canUseBase64) {
      return;
    }

    try {
      const { dataUrl, filename } = buildDownloadFromBase64({
        sourceValue: trimmedBase64Input,
        filename: fileName.trim() || undefined,
        extension: fileExtension.trim() || undefined,
      });
      downloadDataUrl(filename, dataUrl);
      setDecodeStatus(`Downloading ${filename}…`);
    } catch {
      setDecodeStatus("Download failed. Check the Base64 string and try again.");
    }
  }, [canUseBase64, trimmedBase64Input, fileName, fileExtension]);

  const onUpload = useCallback(async (file: File) => {
    setUploadName(file.name);
    setUploadStatus("Reading file…");
    setFileBase64("");

    try {
      const encoded = await fileToBase64DataUrl(file);
      setFileBase64(encoded);
      setUploadStatus("");
    } catch {
      setFileBase64("");
      setUploadStatus("Could not read that file as Base64.");
    }
  }, []);

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.files?.[0];
      if (next) {
        void onUpload(next);
      }
    },
    [onUpload],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const next = event.dataTransfer.files?.[0];
      if (next) {
        void onUpload(next);
      }
    },
    [onUpload],
  );

  const copyFileBase64 = useCallback(async () => {
    if (!fileBase64) {
      setUploadStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(fileBase64);
      setUploadStatus("Base64 string copied to the clipboard.");
    } catch {
      setUploadStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [fileBase64]);

  return (
    <ToolIsland className="b64f-tool">
      <ToolWorkspace className="b64f-tool__workspace" stagger>
        <ToolPanel labelledBy="b64f-decode-heading" className="b64f-tool__panel">
          <ToolSectionHeading
            title="Base64 to file"
            titleId="b64f-decode-heading"
            description={
              <ToolHint>
                Paste a Base64 string (data URI optional), preview images, and
                download the decoded file.
              </ToolHint>
            }
          />

          <ToolFormGrid className="b64f-tool__name-grid">
            <ToolInput
              id="b64f-file-name"
              label="File name"
              full
              value={fileName}
              placeholder="Download filename"
              onChange={(event) => setFileName(event.target.value)}
              autoFocus
            />
            <ToolInput
              id="b64f-file-extension"
              label="Extension"
              value={fileExtension}
              placeholder="Extension"
              onChange={(event) => setFileExtension(event.target.value)}
            />
          </ToolFormGrid>

          <ToolTextarea
            id="b64f-base64-input"
            label="Base64 file string"
            full
            code
            rows={5}
            value={base64Input}
            placeholder="Put your base64 file string here..."
            onChange={(event) => setBase64Input(event.target.value)}
            aria-invalid={base64InputInvalid || undefined}
          />

          {base64InputInvalid ? (
            <ToolStatus tone="error" live="polite">
              Invalid base 64 string
            </ToolStatus>
          ) : null}

          <div className="b64f-tool__preview" aria-live="polite">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Base64 image preview"
                className="b64f-tool__preview-image"
              />
            ) : null}
          </div>

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={previewImage}
              disabled={!canUseBase64}
            >
              Preview image
            </ToolButton>
            <ToolButton
              type="button"
              onClick={downloadFile}
              disabled={!canUseBase64}
            >
              Download file
            </ToolButton>
          </ToolActionRow>

          {decodeStatus ? (
            <ToolStatus tone="success">{decodeStatus}</ToolStatus>
          ) : null}
        </ToolPanel>

        <ToolPanel labelledBy="b64f-encode-heading" className="b64f-tool__panel">
          <ToolSectionHeading
            title="File to base64"
            titleId="b64f-encode-heading"
            description={
              <ToolHint>
                Upload any file to encode it as a Base64 data URL in your
                browser.
              </ToolHint>
            }
          />

          <div
            className={`b64f-tool__upload${dragging ? " b64f-tool__upload--dragging" : ""}`}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragging(false);
            }}
            onDrop={onDrop}
          >
            <label className="b64f-tool__upload-label" htmlFor={fileInputId}>
              <span className="b64f-tool__upload-title">File</span>
              <span className="b64f-tool__upload-hint">
                Drag and drop a file here, or click to select a file
              </span>
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              className="b64f-tool__file-input"
              type="file"
              onChange={onInputChange}
              data-testid="b64f-file-input"
            />
          </div>

          {uploadName ? (
            <p className="b64f-tool__file-meta">
              <strong>{uploadName}</strong>
            </p>
          ) : null}

          <ToolTextarea
            id="b64f-file-base64"
            label="File in base64"
            full
            code
            readOnly
            rows={5}
            value={fileBase64}
            placeholder="File in base64 will be here"
            className="b64f-output"
            aria-live="polite"
          />

          <ToolActionRow>
            <ToolButton
              type="button"
              onClick={() => void copyFileBase64()}
              disabled={!fileBase64}
            >
              Copy
            </ToolButton>
          </ToolActionRow>

          {uploadStatus ? (
            <ToolStatus
              tone={
                uploadStatus.includes("failed") ||
                uploadStatus.includes("Could not")
                  ? "error"
                  : uploadStatus.includes("copied")
                    ? "success"
                    : "default"
              }
            >
              {uploadStatus}
            </ToolStatus>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
