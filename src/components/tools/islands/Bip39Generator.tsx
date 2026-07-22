import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  BIP39_LANGUAGE_DEFAULT,
  BIP39_LANGUAGES,
  BIP39_STRENGTH_DEFAULT,
  BIP39_STRENGTHS,
  type Bip39LanguageId,
  type Bip39Strength,
  bip39WordCount,
  entropyHexToMnemonic,
  generateEntropyHex,
  isValidEntropyHex,
  isValidMnemonic,
  mnemonicToEntropyHex,
  normalizeBip39Language,
  normalizeBip39Strength,
} from "@/lib/tools/bip39-generator";

import "./Bip39Generator.css";

function createSeed(
  strength: Bip39Strength = BIP39_STRENGTH_DEFAULT,
  language: Bip39LanguageId = BIP39_LANGUAGE_DEFAULT,
) {
  const hex = generateEntropyHex(strength);
  return {
    entropy: hex,
    mnemonic: entropyHexToMnemonic(hex, language),
  };
}

function entropyErrorMessage(entropy: string): string | null {
  const value = entropy.trim();
  if (!value) {
    return null;
  }

  if (!/^[0-9a-fA-F]*$/.test(value)) {
    return "Entropy should be a hexadecimal string.";
  }

  if (!isValidEntropyHex(value)) {
    return "Entropy length must be 32, 40, 48, 56, or 64 hex characters (BIP39).";
  }

  return null;
}

function mnemonicErrorMessage(mnemonic: string, language: Bip39LanguageId): string | null {
  const value = mnemonic.trim();
  if (!value) {
    return null;
  }

  if (!isValidMnemonic(value, language)) {
    return "Invalid mnemonic for the selected language.";
  }

  return null;
}

export default function Bip39Generator() {
  const [seed] = useState(() => createSeed());
  const [language, setLanguage] = useState<Bip39LanguageId>(BIP39_LANGUAGE_DEFAULT);
  const [strength, setStrength] = useState<Bip39Strength>(BIP39_STRENGTH_DEFAULT);
  const [entropy, setEntropy] = useState(seed.entropy);
  const [mnemonic, setMnemonic] = useState(seed.mnemonic);
  const [actionStatus, setActionStatus] = useState("");

  const safeLanguage = normalizeBip39Language(language);
  const safeStrength = normalizeBip39Strength(strength);

  const entropyError = useMemo(() => entropyErrorMessage(entropy), [entropy]);
  const mnemonicError = useMemo(
    () => mnemonicErrorMessage(mnemonic, safeLanguage),
    [mnemonic, safeLanguage],
  );

  const languageLabel = useCallback(
    (id: Bip39LanguageId) => BIP39_LANGUAGES.find((entry) => entry.id === id)?.label ?? id,
    [],
  );

  const onLanguageChange = useCallback(
    (next: Bip39LanguageId) => {
      const lang = normalizeBip39Language(next);
      setLanguage(lang);

      if (isValidEntropyHex(entropy)) {
        setMnemonic(entropyHexToMnemonic(entropy, lang));
        setActionStatus(`Language set to ${languageLabel(lang)}.`);
        return;
      }

      if (isValidMnemonic(mnemonic, safeLanguage)) {
        const hex = mnemonicToEntropyHex(mnemonic, safeLanguage);
        setEntropy(hex);
        setMnemonic(entropyHexToMnemonic(hex, lang));
        setActionStatus(`Language set to ${languageLabel(lang)}.`);
      }
    },
    [entropy, languageLabel, mnemonic, safeLanguage],
  );

  const onStrengthChange = useCallback(
    (next: Bip39Strength) => {
      const bits = normalizeBip39Strength(next);
      setStrength(bits);
      const nextSeed = createSeed(bits, normalizeBip39Language(language));
      setEntropy(nextSeed.entropy);
      setMnemonic(nextSeed.mnemonic);
      setActionStatus(`Strength set to ${bits}-bit (${bip39WordCount(bits)} words).`);
    },
    [language],
  );

  const onEntropyChange = useCallback(
    (value: string) => {
      setEntropy(value);

      if (isValidEntropyHex(value)) {
        setMnemonic(entropyHexToMnemonic(value, safeLanguage));
      }
    },
    [safeLanguage],
  );

  const onMnemonicChange = useCallback(
    (value: string) => {
      setMnemonic(value);

      if (isValidMnemonic(value, safeLanguage)) {
        setEntropy(mnemonicToEntropyHex(value, safeLanguage));
      }
    },
    [safeLanguage],
  );

  const refreshEntropy = useCallback(() => {
    const nextSeed = createSeed(safeStrength, safeLanguage);
    setEntropy(nextSeed.entropy);
    setMnemonic(nextSeed.mnemonic);
    setActionStatus("Entropy refreshed.");
  }, [safeLanguage, safeStrength]);

  const copyEntropy = useCallback(async () => {
    if (!isValidEntropyHex(entropy)) {
      setActionStatus("Enter valid entropy before copying.");
      return;
    }

    try {
      await copyTextToClipboard(entropy.trim());
      setActionStatus("Entropy copied.");
    } catch {
      setActionStatus("Copy failed. Select the entropy and copy it manually.");
    }
  }, [entropy]);

  const copyMnemonic = useCallback(async () => {
    if (!isValidMnemonic(mnemonic, safeLanguage)) {
      setActionStatus("Enter a valid mnemonic before copying.");
      return;
    }

    try {
      await copyTextToClipboard(mnemonic.trim());
      setActionStatus("Mnemonic copied.");
    } catch {
      setActionStatus("Copy failed. Select the mnemonic and copy it manually.");
    }
  }, [mnemonic, safeLanguage]);

  return (
    <ToolIsland className="bip39-tool">
      <ToolPanel labelledBy="bip39-heading" className="bip39-tool__panel">
        <ToolSectionHeading
          title="BIP39 passphrase"
          titleId="bip39-heading"
          description={
            <ToolHint>
              Pick a language and strength, refresh or paste entropy, or enter a mnemonic. Valid
              inputs convert both ways.
            </ToolHint>
          }
        />

        <ToolFormGrid>
          <ToolSelect
            id="bip39-language"
            label="Language"
            full
            value={safeLanguage}
            onChange={(event) => onLanguageChange(normalizeBip39Language(event.target.value))}
          >
            {BIP39_LANGUAGES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </ToolSelect>

          <ToolSelect
            id="bip39-strength"
            label="Strength"
            full
            value={String(safeStrength)}
            onChange={(event) => onStrengthChange(normalizeBip39Strength(event.target.value))}
          >
            {BIP39_STRENGTHS.map((bits) => (
              <option key={bits} value={bits}>
                {bits}-bit ({bip39WordCount(bits)} words)
              </option>
            ))}
          </ToolSelect>
        </ToolFormGrid>

        <ToolInput
          id="bip39-entropy"
          label="Entropy (seed)"
          full
          className="tool-code bip39-tool__entropy"
          value={entropy}
          placeholder="Hex entropy…"
          onChange={(event) => onEntropyChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          aria-invalid={entropyError ? true : undefined}
        />

        {entropyError ? (
          <ToolStatus tone="error" live="polite">
            {entropyError}
          </ToolStatus>
        ) : null}

        <ToolActionRow>
          <ToolButton type="button" variant="ghost" onClick={refreshEntropy}>
            Refresh entropy
          </ToolButton>
          <ToolButton
            type="button"
            onClick={() => void copyEntropy()}
            disabled={!isValidEntropyHex(entropy)}
          >
            Copy entropy
          </ToolButton>
        </ToolActionRow>

        <ToolTextarea
          id="bip39-mnemonic"
          label="Passphrase (mnemonic)"
          full
          rows={3}
          value={mnemonic}
          placeholder="BIP39 mnemonic…"
          onChange={(event) => onMnemonicChange(event.target.value)}
          spellCheck={false}
          className="tool-code bip39-tool__mnemonic"
          aria-invalid={mnemonicError ? true : undefined}
        />

        {mnemonicError ? (
          <ToolStatus tone="error" live="polite">
            {mnemonicError}
          </ToolStatus>
        ) : null}

        <ToolActionRow>
          <ToolButton
            type="button"
            onClick={() => void copyMnemonic()}
            disabled={!isValidMnemonic(mnemonic, safeLanguage)}
          >
            Copy mnemonic
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
