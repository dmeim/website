import { useCallback, useEffect, useState } from "react";

import {
  Button,
  ButtonGroup,
  FileDrop,
  Figure,
  FormGrid,
  Input,
  Notice,
  OutputField,
  Panel,
  Textarea,
  ToolFrame,
} from "@/ui/react";
import { downloadDataUrl } from "@/lib/tools/download";
import {
  buildDownloadFromBase64,
  fileToBase64DataUrl,
  isValidBase64,
  resolvePreviewImageSrc,
  suggestExtensionFromBase64,
} from "@/lib/tools/base64-file-converter";

export default function Base64FileConverter() {
  const [fileName, setFileName] = useState("file");
  const [fileExtension, setFileExtension] = useState("");
  const [base64Input, setBase64Input] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");
  const [decodeStatus, setDecodeStatus] = useState("");

  const [fileBase64, setFileBase64] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const trimmedBase64Input = base64Input.trim();
  const base64InputInvalid =
    trimmedBase64Input !== "" && !isValidBase64(trimmedBase64Input);
  const canUseBase64 = trimmedBase64Input !== "" && !base64InputInvalid;

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
      setDecodeStatus(
        "Download failed. Check the Base64 string and try again.",
      );
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

  const onFiles = useCallback(
    (files: File[]) => {
      const next = files[0];
      if (next) {
        void onUpload(next);
      }
    },
    [onUpload],
  );

  const uploadTone =
    uploadStatus.includes("failed") || uploadStatus.includes("Could not")
      ? "danger"
      : "neutral";

  return (
    <ToolFrame layout="split" stagger>
      <Panel
        title="Base64 to file"
        titleId="b64f-decode-heading"
        description="Paste a Base64 string (data URI optional), preview images, and download the decoded file."
      >
        <FormGrid columns={2}>
          <Input
            id="b64f-file-name"
            label="File name"
            value={fileName}
            placeholder="Download filename"
            onChange={(event) => setFileName(event.target.value)}
            autoFocus
          />
          <Input
            id="b64f-file-extension"
            label="Extension"
            mono
            value={fileExtension}
            placeholder="Extension"
            onChange={(event) => setFileExtension(event.target.value)}
          />
        </FormGrid>

        <Textarea
          id="b64f-base64-input"
          label="Base64 file string"
          mono
          rows={5}
          spellCheck={false}
          value={base64Input}
          placeholder="Put your base64 file string here..."
          onChange={(event) => setBase64Input(event.target.value)}
          aria-invalid={base64InputInvalid || undefined}
        />

        {base64InputInvalid ? (
          <Notice tone="danger" live="polite">
            Invalid base 64 string
          </Notice>
        ) : null}

        <div aria-live="polite">
          {previewSrc ? (
            <Figure
              src={previewSrc}
              alt="Base64 image preview"
              frame
              priority
            />
          ) : null}
        </div>

        <ButtonGroup>
          <Button
            iconStart="image"
            onClick={previewImage}
            disabled={!canUseBase64}
          >
            Preview image
          </Button>
          <Button
            variant="primary"
            iconStart="download-simple"
            onClick={downloadFile}
            disabled={!canUseBase64}
          >
            Download file
          </Button>
        </ButtonGroup>

        {decodeStatus ? (
          <Notice
            tone={decodeStatus.startsWith("Downloading") ? "success" : "danger"}
          >
            {decodeStatus}
          </Notice>
        ) : null}
      </Panel>

      <Panel
        title="File to base64"
        titleId="b64f-encode-heading"
        description="Upload any file to encode it as a Base64 data URL in your browser."
      >
        <FileDrop
          label="File"
          onFiles={onFiles}
          hint={uploadName ? <strong>{uploadName}</strong> : undefined}
          data-testid="b64f-file-drop"
        />

        <OutputField
          id="b64f-file-base64"
          label="File in base64"
          multiline
          rows={5}
          value={fileBase64}
          placeholder="File in base64 will be here"
        />

        {uploadStatus ? (
          <Notice tone={uploadTone}>{uploadStatus}</Notice>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
