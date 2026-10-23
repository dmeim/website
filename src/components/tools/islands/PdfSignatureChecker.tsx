import { useCallback, useRef, useState } from "react";

import {
  Card,
  CodeBlock,
  Disclosure,
  FileDrop,
  KeyValue,
  Notice,
  Panel,
  Stack,
  ToolFrame,
} from "@/ui/react";
import {
  type SignatureCertificate,
  type SignatureInfo,
  formatCertDate,
  formatFileBytes,
  partyFieldRows,
  verifyPdfSignatures,
} from "@/lib/tools/pdf-signature-checker";

type Status = "idle" | "loading" | "parsed" | "error";

function KeyValueList({
  label,
  rows,
}: {
  label: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <KeyValue
      aria-label={label}
      density="compact"
      items={
        rows.length > 0
          ? rows.map((row) => ({ label: row.label, value: row.value }))
          : [{ label, value: "—", tone: "muted" }]
      }
    />
  );
}

function CertificateCard({
  certificate,
  index,
}: {
  certificate: SignatureCertificate;
  index: number;
}) {
  const issuedBy = partyFieldRows(certificate.issuedBy);
  const issuedTo = partyFieldRows(certificate.issuedTo);
  const notBefore = formatCertDate(certificate.validityPeriod.notBefore);
  const notAfter = formatCertDate(certificate.validityPeriod.notAfter);

  return (
    <Card as="article" title={`Certificate ${index + 1}`}>
      <Stack gap="md">
        <KeyValueList
          label="Validity period"
          rows={[
            { label: "Not before", value: notBefore },
            { label: "Not after", value: notAfter },
          ]}
        />
        <Disclosure summary="Issued by" level="inline" defaultOpen>
          <KeyValueList label="Issued by" rows={issuedBy} />
        </Disclosure>
        <Disclosure summary="Issued to" level="inline" defaultOpen>
          <KeyValueList label="Issued to" rows={issuedTo} />
        </Disclosure>
        <Disclosure summary="View PEM certificate" level="inline">
          <CodeBlock code={certificate.pemCertificate} />
        </Disclosure>
      </Stack>
    </Card>
  );
}

function SignatureBlock({
  signature,
  index,
}: {
  signature: SignatureInfo;
  index: number;
}) {
  return (
    <Panel
      title={`Signature ${index + 1} certificates`}
      titleId={`pdf-sig-${index}`}
      headingLevel={3}
    >
      <Stack gap="md">
        {signature.meta.certs.map((certificate, certIndex) => (
          <CertificateCard
            key={`${index}-${certIndex}-${certificate.pemCertificate.slice(0, 24)}`}
            certificate={certificate}
            index={certIndex}
          />
        ))}
      </Stack>
    </Panel>
  );
}

export default function PdfSignatureChecker() {
  const runIdRef = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [signatures, setSignatures] = useState<SignatureInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  const onVerifyFile = useCallback(async (uploaded: File) => {
    const runId = ++runIdRef.current;
    setFile(uploaded);
    setStatus("loading");
    setSignatures([]);
    setErrorMessage("");

    try {
      const buffer = await uploaded.arrayBuffer();
      const parsed = await verifyPdfSignatures(buffer);
      if (runId !== runIdRef.current) {
        return;
      }
      setSignatures(parsed);
      setStatus("parsed");
    } catch (error) {
      if (runId !== runIdRef.current) {
        return;
      }
      setSignatures([]);
      setStatus("error");
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : "No signatures found in the provided file.",
      );
    }
  }, []);

  const onFiles = useCallback(
    (files: File[]) => {
      const next = files[0];
      if (next) {
        void onVerifyFile(next);
      }
    },
    [onVerifyFile],
  );

  return (
    <ToolFrame>
      <Panel
        title="PDF signatures"
        titleId="pdf-sig-heading"
        description="Choose a PDF to inspect embedded digital signatures and certificate chains. All parsing runs in your browser."
      >
        <FileDrop
          label="PDF file"
          accept=".pdf,application/pdf"
          onFiles={onFiles}
          hint={
            file ? `${file.name} · ${formatFileBytes(file.size)}` : undefined
          }
          data-testid="pdf-file-drop"
        />

        {status === "loading" ? (
          <Notice tone="neutral" live="polite">
            Checking signatures…
          </Notice>
        ) : null}

        {status === "error" ? (
          <Notice tone="danger" live="assertive">
            {errorMessage}
          </Notice>
        ) : null}
      </Panel>

      {status === "parsed" && signatures.length > 0
        ? signatures.map((signature, index) => (
            <SignatureBlock key={index} signature={signature} index={index} />
          ))
        : null}
    </ToolFrame>
  );
}
