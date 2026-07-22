import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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
  const [actionStatus, setActionStatus] = useState("");

  const info = useMemo(() => parseIban(rawIban), [rawIban]);
  const rows = useMemo(() => (info ? buildRows(info) : []), [info]);

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value || value === "N/A") {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  }, []);

  return (
    <ToolIsland className="iban-tool">
      <ToolPanel labelledBy="iban-heading" className="iban-tool__panel">
        <ToolSectionHeading
          title="IBAN validator"
          titleId="iban-heading"
          description={
            <ToolHint>
              Enter an IBAN to check validity and extract country, BBAN, QR
              status, and a friendly spaced format.
            </ToolHint>
          }
        />

        <ToolInput
          id="iban-input"
          label="IBAN"
          full
          code
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
          <div className="iban-results" role="list" aria-label="IBAN details">
            {rows.map((row) => (
              <div key={row.key} className="iban-row" role="listitem">
                <span className="iban-row__label">{row.label}</span>
                <div className="iban-row__body">
                  <span
                    className={
                      row.key === "errors"
                        ? "iban-row__value iban-row__value--errors"
                        : "iban-row__value tool-code"
                    }
                    aria-live="polite"
                  >
                    {row.value}
                  </span>
                  {row.copyable ? (
                    <ToolActionRow className="iban-row__actions">
                      <ToolButton
                        type="button"
                        onClick={() => void copyValue(row.label, row.value)}
                      >
                        Copy
                      </ToolButton>
                    </ToolActionRow>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="iban-examples">
          <h3 className="iban-examples__title">Valid IBAN examples</h3>
          <ul className="iban-examples__list">
            {IBAN_EXAMPLES.map((example) => {
              const friendly = formatIbanFriendly(example);
              return (
                <li key={example} className="iban-examples__item">
                  <button
                    type="button"
                    className="iban-examples__btn tool-code"
                    onClick={() => {
                      setRawIban(example);
                      setActionStatus("");
                    }}
                  >
                    {friendly}
                  </button>
                  <ToolButton
                    type="button"
                    variant="ghost"
                    onClick={() => void copyValue("Example IBAN", example)}
                  >
                    Copy
                  </ToolButton>
                </li>
              );
            })}
          </ul>
        </div>

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}
