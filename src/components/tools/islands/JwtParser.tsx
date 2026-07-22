import { useMemo, useState } from "react";

import {
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import {
  DEFAULT_JWT,
  decodeJwt,
  isValidJwt,
  type JwtClaimRow,
} from "@/lib/tools/jwt-parser";

import "./JwtParser.css";

const SECTIONS = [
  { key: "header" as const, title: "Header" },
  { key: "payload" as const, title: "Payload" },
];

export default function JwtParser() {
  const [rawJwt, setRawJwt] = useState(DEFAULT_JWT);

  const valid = isValidJwt(rawJwt);
  const decoded = useMemo(
    () => (valid ? decodeJwt({ jwt: rawJwt }) : undefined),
    [rawJwt, valid],
  );

  return (
    <ToolIsland className="jwt-tool">
      <ToolWorkspace className="jwt-tool__workspace" stagger>
        <ToolPanel labelledBy="jwt-heading" className="jwt-tool__panel">
          <ToolSectionHeading
            title="JWT parser"
            titleId="jwt-heading"
            description={
              <ToolHint>
                Paste a JWT to decode its header and payload claims. The
                signature segment is shown as-is and is not verified.
              </ToolHint>
            }
          />

          <ToolTextarea
            id="jwt-input"
            label="JWT to decode"
            full
            code
            rows={5}
            value={rawJwt}
            placeholder="Put your token here…"
            spellCheck={false}
            autoFocus
            onChange={(event) => setRawJwt(event.target.value)}
            aria-invalid={!valid || undefined}
          />

          {!valid ? (
            <ToolStatus tone="error" live="polite">
              Invalid JWT
            </ToolStatus>
          ) : null}

          {decoded ? (
            <>
              <div className="jwt-table-wrap">
                <table className="jwt-table">
                  <tbody>
                    {SECTIONS.map((section) => (
                      <ClaimSection
                        key={section.key}
                        title={section.title}
                        rows={decoded[section.key]}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="jwt-signature">
                <span className="jwt-signature__label">Signature</span>
                <code className="jwt-signature__value tool-code" aria-live="polite">
                  {decoded.signature || "(empty)"}
                </code>
              </div>
            </>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}

function ClaimSection({
  title,
  rows,
}: {
  title: string;
  rows: JwtClaimRow[];
}) {
  return (
    <>
      <tr>
        <th colSpan={2} className="jwt-table__section" scope="colgroup">
          {title}
        </th>
      </tr>
      {rows.map((row) => (
        <tr key={`${row.claim}:${row.value}`}>
          <td className="jwt-table__claim">
            <span className="jwt-table__claim-name">{row.claim}</span>
            {row.claimDescription ? (
              <span className="jwt-table__claim-desc">
                ({row.claimDescription})
              </span>
            ) : null}
          </td>
          <td className="jwt-table__value">
            <span>{row.value}</span>
            {row.friendlyValue ? (
              <span className="jwt-table__friendly">({row.friendlyValue})</span>
            ) : null}
          </td>
        </tr>
      ))}
    </>
  );
}
