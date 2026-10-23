import { useMemo, useState } from "react";
import type { CountryCode } from "libphonenumber-js/max";

import { Input, KeyValue, Panel, Select, ToolFrame } from "@/ui/react";
import {
  booleanToHumanReadable,
  getCountryOptions,
  getDefaultCountryCode,
  isValidPhoneInput,
  parsePhone,
  type PhoneParseResult,
} from "@/lib/tools/phone-parser-and-formatter";

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

  const countryOptions = useMemo(() => getCountryOptions(), []);

  const inputValid = isValidPhoneInput(rawPhone);
  const info = useMemo(() => {
    if (!inputValid) {
      return undefined;
    }
    return parsePhone(rawPhone, defaultCountry);
  }, [rawPhone, defaultCountry, inputValid]);

  const rows = useMemo(() => (info ? buildRows(info) : []), [info]);

  return (
    <ToolFrame>
      <Panel
        title="Phone parser"
        titleId="phone-heading"
        description="Enter a phone number to validate it and see country, type, and standard formats. Default country applies when no country prefix is present."
      >
        <Select
          id="phone-default-country"
          label="Default country code"
          value={defaultCountry}
          options={countryOptions.map((option) => ({ value: option.code, label: option.label }))}
          onChange={(event) => setDefaultCountry(event.target.value as CountryCode)}
        />

        <Input
          id="phone-input"
          label="Phone number"
          mono
          value={rawPhone}
          placeholder="Enter a phone number"
          spellCheck={false}
          autoFocus
          autoComplete="tel"
          inputMode="tel"
          error={rawPhone !== "" && !inputValid ? "Invalid phone number" : undefined}
          onChange={(event) => setRawPhone(event.target.value)}
        />

        {rows.length > 0 ? (
          <KeyValue
            aria-label="Phone number details"
            aria-live="polite"
            items={rows.map((row) => ({
              label: row.label,
              value: row.value,
              mono: row.value !== "Unknown",
              tone: row.value === "Unknown" ? "muted" : "default",
              copy: row.copyable,
            }))}
          />
        ) : null}
      </Panel>
    </ToolFrame>
  );
}
