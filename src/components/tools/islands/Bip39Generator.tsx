import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, FormGrid, Input, Panel, Select, Textarea, ToolFrame } from "@/ui/react";
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

  const safeLanguage = normalizeBip39Language(language);
  const safeStrength = normalizeBip39Strength(strength);

  const entropyError = useMemo(() => entropyErrorMessage(entropy), [entropy]);
  const mnemonicError = useMemo(
    () => mnemonicErrorMessage(mnemonic, safeLanguage),
    [mnemonic, safeLanguage],
  );

  const onLanguageChange = useCallback(
    (next: Bip39LanguageId) => {
      const lang = normalizeBip39Language(next);
      setLanguage(lang);

      if (isValidEntropyHex(entropy)) {
        setMnemonic(entropyHexToMnemonic(entropy, lang));
        return;
      }

      if (isValidMnemonic(mnemonic, safeLanguage)) {
        const hex = mnemonicToEntropyHex(mnemonic, safeLanguage);
        setEntropy(hex);
        setMnemonic(entropyHexToMnemonic(hex, lang));
        return;
      }

      // A mnemonic pasted before picking its language becomes valid only now.
      if (isValidMnemonic(mnemonic, lang)) {
        const hex = mnemonicToEntropyHex(mnemonic, lang);
        setEntropy(hex);
        setStrength(normalizeBip39Strength(hex.length * 4));
      }
    },
    [entropy, mnemonic, safeLanguage],
  );

  const onStrengthChange = useCallback(
    (next: Bip39Strength) => {
      const bits = normalizeBip39Strength(next);
      setStrength(bits);
      const nextSeed = createSeed(bits, normalizeBip39Language(language));
      setEntropy(nextSeed.entropy);
      setMnemonic(nextSeed.mnemonic);
    },
    [language],
  );

  const onEntropyChange = useCallback(
    (value: string) => {
      setEntropy(value);

      if (isValidEntropyHex(value)) {
        setMnemonic(entropyHexToMnemonic(value, safeLanguage));
        setStrength(normalizeBip39Strength(value.trim().length * 4));
      } else {
        setMnemonic("");
      }
    },
    [safeLanguage],
  );

  const onMnemonicChange = useCallback(
    (value: string) => {
      setMnemonic(value);

      if (isValidMnemonic(value, safeLanguage)) {
        const hex = mnemonicToEntropyHex(value, safeLanguage);
        setEntropy(hex);
        setStrength(normalizeBip39Strength(hex.length * 4));
      } else {
        setEntropy("");
      }
    },
    [safeLanguage],
  );

  const refreshEntropy = useCallback(() => {
    const nextSeed = createSeed(safeStrength, safeLanguage);
    setEntropy(nextSeed.entropy);
    setMnemonic(nextSeed.mnemonic);
  }, [safeLanguage, safeStrength]);

  const entropyValid = isValidEntropyHex(entropy);
  const mnemonicValid = isValidMnemonic(mnemonic, safeLanguage);

  return (
    <ToolFrame>
      <Panel
        title="BIP39 passphrase"
        titleId="bip39-heading"
        description="Pick a language and strength, refresh or paste entropy, or enter a mnemonic. Valid inputs convert both ways."
      >
        <FormGrid columns={2}>
          <Select
            id="bip39-language"
            label="Language"
            value={safeLanguage}
            onChange={(event) => onLanguageChange(normalizeBip39Language(event.target.value))}
            options={BIP39_LANGUAGES.map((entry) => ({ value: entry.id, label: entry.label }))}
          />
          <Select
            id="bip39-strength"
            label="Strength"
            value={String(safeStrength)}
            onChange={(event) => onStrengthChange(normalizeBip39Strength(event.target.value))}
            options={BIP39_STRENGTHS.map((bits) => ({ value: String(bits), label: `${bits}-bit (${bip39WordCount(bits)} words)` }))}
          />
        </FormGrid>

        <Input
          id="bip39-entropy"
          label="Entropy (seed)"
          mono
          value={entropy}
          placeholder="Hex entropy…"
          onChange={(event) => onEntropyChange(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          autoFocus
          error={entropyError ?? undefined}
        />

        <ButtonGroup>
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refreshEntropy}>
            Refresh entropy
          </Button>
          <CopyButton getValue={() => entropy.trim()} label="Copy entropy" disabled={!entropyValid} />
        </ButtonGroup>

        <Textarea
          id="bip39-mnemonic"
          label="Passphrase (mnemonic)"
          mono
          rows={3}
          value={mnemonic}
          placeholder="BIP39 mnemonic…"
          onChange={(event) => onMnemonicChange(event.target.value)}
          spellCheck={false}
          error={mnemonicError ?? undefined}
        />

        <div>
          <CopyButton getValue={() => mnemonic.trim()} label="Copy mnemonic" disabled={!mnemonicValid} />
        </div>
      </Panel>
    </ToolFrame>
  );
}
