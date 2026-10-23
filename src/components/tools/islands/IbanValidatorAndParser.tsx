import { useMemo, useState } from "react";

import { Button, CopyButton, Input, KeyValue, Panel, ToolFrame } from "@/ui/react";
import {
  IBAN_EXAMPLES,
  formatIbanFriendly,
  parseIban,
  type IbanInfo,
} from "@/lib/tools/iban-validator-and-parser";

import "./IbanValidatorAndParser.css";

type InfoRow = {
  key: string;
  label: string;
  value: string;
  copyable: boolean;
};

function buildRows(info: IbanInfo): InfoRow[] {
  const rows: InfoRow[] = [
    {
      key: "valid",
      label: "Is IBAN valid?",
      value: info.isValid ? "Yes" : "No",
      copyable: false,
    },
  ];

  if (info.errors.length > 0) {
    rows.push({
      key: "errors",
      label: "IBAN errors",
      value: info.errors.join("\n"),
      copyable: false,
    });
  }

  rows.push(
    {
      key: "qr",
      label: "Is IBAN a QR-IBAN?",
      value: info.isQrIban ? "Yes" : "No",
      copyable: false,
    },
    {
      key: "country",
      label: "Country code",
      value: info.countryCode ?? "N/A",
      copyable: Boolean(info.countryCode),
    },
    {
      key: "bban",
      label: "BBAN",
      value: info.bban ?? "N/A",
      copyable: Boolean(info.bban),
    },
    {
      key: "friendly",
      label: "IBAN friendly format",
      value: info.friendlyFormat,
      copyable: Boolean(info.friendlyFormat),
    },
  );

  return rows;
}

export default function IbanValidatorAndParser() {
  const [rawIban, setRawIban] = useState("");

  const info = useMemo(() => parseIban(rawIban), [rawIban]);
  const rows = useMemo(() => (info ? buildRows(info) : []), [info]);

  return (
    <ToolFrame>
      <Panel
        title="IBAN validator"
        titleId="iban-heading"
        description="Enter an IBAN to check validity and extract country, BBAN, QR status, and a friendly spaced format."
      >
        <Input
          id="iban-input"
          label="IBAN"
          mono
          value={rawIban}
          placeholder="Enter an IBAN to check for validity…"
          spellCheck={false}
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          onChange={(event) => setRawIban(event.target.value)}
        />

        {rows.length > 0 ? (
          <KeyValue
            aria-label="IBAN details"
            aria-live="polite"
            items={rows.map((row) => ({
              label: row.label,
              value: row.key === "errors" ? <span className="iban-errors">{row.value}</span> : row.value,
              mono: row.key !== "errors",
              tone: row.key === "errors" ? "danger" : row.value === "N/A" ? "muted" : "default",
              copy: row.copyable ? row.value : false,
            }))}
          />
        ) : null}
      </Panel>

      <Panel title="Valid IBAN examples" titleId="iban-examples-heading" headingLevel={3}>
        <ul className="iban-examples">
          {IBAN_EXAMPLES.map((example) => (
            <li key={example} className="iban-examples__item">
              <Button
                variant="ghost"
                size="sm"
                className="iban-examples__btn"
                onClick={() => setRawIban(example)}
              >
                {formatIbanFriendly(example)}
              </Button>
              <CopyButton appearance="icon" size="sm" value={example} label="Copy example IBAN" />
            </li>
          ))}
        </ul>
      </Panel>
    </ToolFrame>
  );
}
