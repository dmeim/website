import { useMemo, useState } from "react";

import { KeyValue, Notice, Panel, SectionHeading, Textarea, ToolFrame, type KeyValueItem } from "@/ui/react";
import {
  DEFAULT_JWT,
  decodeJwt,
  isValidJwt,
  type JwtClaimRow,
} from "@/lib/tools/jwt-parser";

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
    <ToolFrame>
      <Panel
        title="JWT parser"
        titleId="jwt-heading"
        description="Paste a JWT to decode its header and payload claims. The signature segment is shown as-is and is not verified."
      >
        <Textarea
          id="jwt-input"
          label="JWT to decode"
          mono
          rows={5}
          value={rawJwt}
          placeholder="Put your token here…"
          spellCheck={false}
          autoFocus
          onChange={(event) => setRawJwt(event.target.value)}
          aria-invalid={!valid || undefined}
        />

        {!valid ? (
          <Notice tone="danger" live="polite">
            Invalid JWT
          </Notice>
        ) : null}

        {decoded ? (
          <>
            {SECTIONS.map((section) => (
              <section key={section.key} aria-labelledby={`jwt-${section.key}-heading`}>
                <SectionHeading title={section.title} titleId={`jwt-${section.key}-heading`} level={3} />
                <KeyValue items={decoded[section.key].map(claimItem)} />
              </section>
            ))}

            <KeyValue
              aria-live="polite"
              items={[
                {
                  label: "Signature",
                  value: decoded.signature || "(empty)",
                  mono: true,
                  copy: decoded.signature ? decoded.signature : false,
                },
              ]}
            />
          </>
        ) : null}
      </Panel>
    </ToolFrame>
  );
}

function claimItem(row: JwtClaimRow): KeyValueItem {
  const hint = [row.claimDescription, row.friendlyValue].filter(Boolean).join(" · ");
  return {
    label: row.claim,
    value: String(row.value),
    mono: true,
    copy: true,
    hint: hint || undefined,
  };
}
