import { useCallback, useMemo, useState } from "react";
import type { CountryCode } from "libphonenumber-js/max";

import {
  ToolActionRow,
  ToolButton,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  booleanToHumanReadable,
  getCountryOptions,
  getDefaultCountryCode,
  isValidPhoneInput,
  parsePhone,
  type PhoneParseResult,
} from "@/lib/tools/phone-parser-and-formatter";

import "./PhoneParserAndFormatter.css";

type InfoRow = {
  key: string;
  label: string;
  value: string;
  copyable: boolean;
};

function buildRows(info: PhoneParseResult): InfoRow[] {
  const asDisplay = (value: string | undefined) => value || "Unknown";

  return [
    {
      key: "country-code",
      label: "Country code",
      value: asDisplay(info.countryCode),
      copyable: Boolean(info.countryCode),
    },
    {
      key: "country-name",
      label: "Country",
      value: asDisplay(info.countryName),
      copyable: Boolean(info.countryName),
    },
    {
      key: "calling-code",
      label: "Country calling code",
      value: asDisplay(info.countryCallingCode),
      copyable: Boolean(info.countryCallingCode),
    },
    {
      key: "valid",
      label: "Is valid?",
      value: booleanToHumanReadable(info.isValid),
      copyable: false,
    },
    {
      key: "possible",
      label: "Is possible?",
      value: booleanToHumanReadable(info.isPossible),
      copyable: false,
    },
    {
      key: "type",
      label: "Type",
      value: asDisplay(info.type),
      copyable: Boolean(info.type),
    },
    {
      key: "international",
      label: "International format",
      value: asDisplay(info.international),
      copyable: Boolean(info.international),
    },
    {
      key: "national",
      label: "National format",
      value: asDisplay(info.national),
      copyable: Boolean(info.national),
    },
    {
      key: "e164",
      label: "E.164 format",
      value: asDisplay(info.e164),
      copyable: Boolean(info.e164),
    },
    {
      key: "rfc3966",
      label: "RFC3966 format",
      value: asDisplay(info.rfc3966),
      copyable: Boolean(info.rfc3966),
    },
  ];
}

export default function PhoneParserAndFormatter() {
  const [defaultCountry, setDefaultCountry] = useState<CountryCode>(() =>
    getDefaultCountryCode(),
  );
  const [rawPhone, setRawPhone] = useState("");
  const [actionStatus, setActionStatus] = useState("");

  const countryOptions = useMemo(() => getCountryOptions(), []);

  const inputValid = isValidPhoneInput(rawPhone);
  const info = useMemo(() => {
    if (!inputValid) {
      return undefined;
    }
    return parsePhone(rawPhone, defaultCountry);
  }, [rawPhone, defaultCountry, inputValid]);

  const rows = useMemo(() => (info ? buildRows(info) : []), [info]);

  const copyValue = useCallback(async (label: string, value: string) => {
    if (!value || value === "Unknown") {
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
    <ToolIsland className="phone-tool">
      <ToolPanel labelledBy="phone-heading" className="phone-tool__panel">
        <ToolSectionHeading
          title="Phone parser"
          titleId="phone-heading"
          description={
            <ToolHint>
              Enter a phone number to validate it and see country, type, and
              standard formats. Default country applies when no country prefix
              is present.
            </ToolHint>
          }
        />

        <ToolSelect
          id="phone-default-country"
          label="Default country code"
          full
          value={defaultCountry}
          onChange={(event) => {
            setDefaultCountry(event.target.value as CountryCode);
            setActionStatus("");
          }}
        >
          {countryOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </ToolSelect>

        <ToolInput
          id="phone-input"
          label="Phone number"
          full
          value={rawPhone}
          placeholder="Enter a phone number"
          spellCheck={false}
          autoFocus
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={rawPhone !== "" && !inputValid ? true : undefined}
          onChange={(event) => {
            setRawPhone(event.target.value);
            setActionStatus("");
          }}
        />

        {rawPhone !== "" && !inputValid ? (
          <ToolStatus tone="error">Invalid phone number</ToolStatus>
        ) : null}

        {rows.length > 0 ? (
          <div
            className="phone-results"
            role="list"
            aria-label="Phone number details"
          >
            {rows.map((row) => (
              <div key={row.key} className="phone-row" role="listitem">
                <span className="phone-row__label">{row.label}</span>
                <div className="phone-row__body">
                  <span
                    className={
                      row.value === "Unknown"
                        ? "phone-row__value phone-row__value--unknown"
                        : "phone-row__value tool-code"
                    }
                    aria-live="polite"
                  >
                    {row.value}
                  </span>
                  {row.copyable ? (
                    <ToolActionRow className="phone-row__actions">
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

        {actionStatus ? (
          <ToolStatus tone="success">{actionStatus}</ToolStatus>
        ) : null}
      </ToolPanel>
    </ToolIsland>
  );
}
