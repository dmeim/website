import { useCallback, useId, useRef, useState, type ChangeEvent } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import {
  type SignatureCertificate,
  type SignatureInfo,
  formatCertDate,
  formatFileBytes,
  partyFieldRows,
  verifyPdfSignatures,
} from "@/lib/tools/pdf-signature-checker";

import "./PdfSignatureChecker.css";

type Status = "idle" | "loading" | "parsed" | "error";

function KeyValueList({ rows }: { rows: { label: string; value: string }[] }) {
  if (rows.length === 0) {
    return <p className="pdf-sig__muted">—</p>;
  }

  return (
    <dl className="pdf-sig__kv">
      {rows.map((row) => (
        <div key={row.label} className="pdf-sig__kv-row">
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
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
    <article className="pdf-sig__cert">
      <h4 className="pdf-sig__cert-title">Certificate {index + 1}</h4>

      <div className="pdf-sig__cert-block">
        <h5 className="pdf-sig__cert-label">Validity period</h5>
        <KeyValueList
          rows={[
            { label: "Not before", value: notBefore },
            { label: "Not after", value: notAfter },
          ]}
        />
      </div>

      <div className="pdf-sig__cert-block">
        <h5 className="pdf-sig__cert-label">Issued by</h5>
        <KeyValueList rows={issuedBy} />
      </div>

      <div className="pdf-sig__cert-block">
        <h5 className="pdf-sig__cert-label">Issued to</h5>
        <KeyValueList rows={issuedTo} />
      </div>

      <details className="pdf-sig__pem">
        <summary>View PEM certificate</summary>
        <pre className="pdf-sig__pem-body">{certificate.pemCertificate}</pre>
      </details>
    </article>
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
    <section className="pdf-sig__signature" aria-labelledby={`pdf-sig-${index}`}>
      <h3 id={`pdf-sig-${index}`} className="pdf-sig__signature-title">
        Signature {index + 1} certificates
      </h3>
      <div className="pdf-sig__certs">
        {signature.meta.certs.map((certificate, certIndex) => (
          <CertificateCard
            key={`${index}-${certIndex}-${certificate.pemCertificate.slice(0, 24)}`}
            certificate={certificate}
            index={certIndex}
          />
        ))}
      </div>
    </section>
  );
}

export default function PdfSignatureChecker() {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
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

  const onInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = event.target.files?.[0];
      if (next) {
        void onVerifyFile(next);
      }
    },
    [onVerifyFile],
  );

  return (
    <ToolIsland className="pdf-sig">
      <ToolPanel labelledBy="pdf-sig-heading" className="pdf-sig__panel">
        <ToolSectionHeading
          title="PDF signatures"
          titleId="pdf-sig-heading"
          description={
            <ToolHint>
              Choose a PDF to inspect embedded digital signatures and certificate chains. All
              parsing runs in your browser.
            </ToolHint>
          }
        />

        <div className="pdf-sig__upload">
          <label className="pdf-sig__upload-label" htmlFor={inputId}>
            <span className="pdf-sig__upload-title">PDF file</span>
            <span className="pdf-sig__upload-hint">
              Drag and drop a PDF here, or click to select a file
            </span>
          </label>
          <input
            ref={inputRef}
            id={inputId}
            className="pdf-sig__file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={onInputChange}
            data-testid="pdf-file-input"
          />
        </div>

        {file ? (
          <p className="pdf-sig__file-meta">
            <strong>{file.name}</strong>
            <span aria-hidden="true"> · </span>
            <span>{formatFileBytes(file.size)}</span>
          </p>
        ) : null}

        {status === "loading" ? (
          <ToolStatus tone="default" live="polite">
            Checking signatures…
          </ToolStatus>
        ) : null}

        {status === "error" ? (
          <ToolStatus tone="error" live="assertive">
            {errorMessage}
          </ToolStatus>
        ) : null}
      </ToolPanel>

      {status === "parsed" && signatures.length > 0 ? (
        <div className="pdf-sig__results">
          {signatures.map((signature, index) => (
            <SignatureBlock key={index} signature={signature} index={index} />
          ))}
        </div>
      ) : null}
    </ToolIsland>
  );
}
