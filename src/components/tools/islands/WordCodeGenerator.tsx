import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolField,
  ToolFormGrid,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolStatus,
  ToolTextarea,
  ToolWorkspace,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  applyLengthFilter,
  clampNumber,
  formatOutput,
  generateCodeItems,
  getLengthLabel,
  getSelectedWords,
  loadWordCategories,
  parseExtraWords,
  previewWords,
  uniqueWords,
} from "@/lib/tools/word-code/wordCode.service";
import type {
  DigitPosition,
  GeneratedCode,
  OutputFormat,
  SeparatorOption,
  WordCase,
  WordCategory,
} from "@/lib/tools/word-code/wordCode.types";

import "./WordCodeGenerator.css";

export default function WordCodeGenerator() {
  const [categories, setCategories] = useState<WordCategory[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadStatusMessage, setLoadStatusMessage] = useState("Loading word categories…");
  const [loadStatusType, setLoadStatusType] = useState<"success" | "error" | "">("");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [extraWordsText, setExtraWordsText] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");
  const [lengthMin, setLengthMin] = useState(1);
  const [lengthMax, setLengthMax] = useState(10);

  const [digits, setDigits] = useState(2);
  const [position, setPosition] = useState<DigitPosition>("end");
  const [randomize, setRandomize] = useState(true);
  const [allowRepeats, setAllowRepeats] = useState(true);
  const [wordCase, setWordCase] = useState<WordCase>("normal");
  const [results, setResults] = useState(20);

  const [outputFormat, setOutputFormat] = useState<OutputFormat>("column");
  const [separator, setSeparator] = useState<SeparatorOption>(",");
  const [customSeparator, setCustomSeparator] = useState("|");
  const [addSpaces, setAddSpaces] = useState(false);

  const [lastCodes, setLastCodes] = useState<GeneratedCode[]>([]);
  const [lastPosition, setLastPosition] = useState<DigitPosition>("end");
  const [lastOutputMeta, setLastOutputMeta] = useState("Your generated codes will appear here.");
  const [outputMetaText, setOutputMetaText] = useState("Your generated codes will appear here.");
  const [outputMessage, setOutputMessage] = useState("");

  const outputHeadingRef = useRef<HTMLDivElement>(null);
  const previousBoundsMax = useRef<number | null>(null);
  const lengthMinRef = useRef(lengthMin);
  const lengthMaxRef = useRef(lengthMax);
  lengthMinRef.current = lengthMin;
  lengthMaxRef.current = lengthMax;

  const visibleCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    return categories.filter((category) =>
      `${category.name} ${category.description} ${category.words.join(" ")}`
        .toLowerCase().includes(query),
    );
  }, [categories, categoryQuery]);

  useEffect(() => {
    if (!lastCodes.length && !outputMessage) return;
    const heading = outputHeadingRef.current;
    const bounds = heading?.getBoundingClientRect();
    const viewport = heading?.closest(".tools-stage__body")?.getBoundingClientRect();
    if (bounds && viewport && bounds.top >= viewport.top && bounds.bottom <= viewport.bottom) return;
    heading?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  }, [lastCodes, outputMessage]);

  const extraWords = useMemo(() => parseExtraWords(extraWordsText), [extraWordsText]);

  const selectedWordsUnfiltered = useMemo(
    () =>
      getSelectedWords({
        categories,
        selectedCategoryIds,
        extraWords,
      }),
    [categories, selectedCategoryIds, extraWords],
  );

  const selectedWords = useMemo(
    () => applyLengthFilter(selectedWordsUnfiltered, lengthMin, lengthMax),
    [selectedWordsUnfiltered, lengthMin, lengthMax],
  );

  const allKnownWords = useMemo(
    () => uniqueWords([...categories.flatMap((category) => category.words), ...extraWords]),
    [categories, extraWords],
  );

  const lengthBounds = useMemo(
    () => ({
      min: 1,
      max: Math.max(1, ...allKnownWords.map((word) => word.length)),
    }),
    [allKnownWords],
  );

  const lengthLabel = useMemo(
    () =>
      getLengthLabel({
        min: lengthMin,
        max: lengthMax,
        boundsMin: lengthBounds.min,
        boundsMax: lengthBounds.max,
      }),
    [lengthMin, lengthMax, lengthBounds],
  );

  const poolSummary = useMemo(() => {
    if (!selectedWordsUnfiltered.length) {
      return "Choose at least one category or add your own words.";
    }

    const selectedCount = selectedCategoryIds.length;
    const extraCount = extraWords.length;
    const categoryText = `${selectedCount} ${selectedCount === 1 ? "category" : "categories"} selected`;
    const extraText = extraCount
      ? ` + ${extraCount} extra ${extraCount === 1 ? "word" : "words"}`
      : "";

    if (!selectedWords.length) {
      return `${categoryText}${extraText} • No words match the ${lengthLabel} length filter.`;
    }

    if (selectedWords.length === selectedWordsUnfiltered.length) {
      return `${categoryText}${extraText} • ${selectedWords.length} words available.`;
    }

    return `${categoryText}${extraText} • ${selectedWords.length} of ${selectedWordsUnfiltered.length} words match the ${lengthLabel} length filter.`;
  }, [
    selectedWordsUnfiltered,
    selectedCategoryIds.length,
    extraWords.length,
    selectedWords,
    lengthLabel,
  ]);

  const isLengthFiltered =
    lengthMin !== lengthBounds.min || lengthMax !== lengthBounds.max;

  const lengthRangeFillStyle = useMemo((): CSSProperties => {
    const span = Math.max(1, lengthBounds.max - lengthBounds.min);
    const singleValueRange = lengthBounds.max === lengthBounds.min;
    const left = singleValueRange ? 0 : ((lengthMin - lengthBounds.min) / span) * 100;
    const right = singleValueRange
      ? 0
      : 100 - ((lengthMax - lengthBounds.min) / span) * 100;

    return { left: `${left}%`, right: `${right}%` };
  }, [lengthBounds, lengthMin, lengthMax]);

  const lastOutput = useMemo(() => {
    if (!lastCodes.length) {
      return "";
    }

    return formatOutput(lastCodes, {
      format: outputFormat,
      separator,
      customSeparator,
      addSpaces,
      position: lastPosition,
      wordCase,
    });
  }, [lastCodes, outputFormat, separator, customSeparator, addSpaces, lastPosition, wordCase]);


  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadStatusMessage("Loading word categories…");
      setLoadStatusType("");
      setIsLoading(true);

      try {
        const loaded = await loadWordCategories();
        if (cancelled) return;

        setCategories(loaded.categories);
        setWarnings(loaded.warnings);
        setSelectedCategoryIds(
          loaded.categories
            .filter((category) => category.defaultSelected)
            .map((category) => category.id),
        );
        setLoadStatusMessage(
          `Loaded ${loaded.categories.length} categories / ${loaded.totalUniqueWords} unique words.`,
        );
        setLoadStatusType("success");
        setIsLoading(false);
      } catch (error) {
        if (cancelled) return;

        setCategories([]);
        setWarnings([]);
        setSelectedCategoryIds([]);
        setIsLoading(false);
        setLoadStatusMessage(
          `${error instanceof Error ? error.message : String(error)} Check The Bundled WordCode Category Data.`,
        );
        setLoadStatusType("error");
        setOutputMessage(
          "Could Not Load Word Categories. Make Sure The Category JSON Files Are Present In The WordCode Source Folder.",
        );
        setOutputMetaText("Category Loading Failed.");
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const wasAtUpperLimit =
      previousBoundsMax.current === null ||
      lengthMaxRef.current >= previousBoundsMax.current;

    const nextMin = clampNumber(
      lengthMinRef.current,
      lengthBounds.min,
      lengthBounds.max,
      lengthBounds.min,
    );
    let nextMax = wasAtUpperLimit
      ? lengthBounds.max
      : clampNumber(
          lengthMaxRef.current,
          lengthBounds.min,
          lengthBounds.max,
          lengthBounds.max,
        );

    if (nextMin > nextMax) {
      nextMax = nextMin;
    }

    previousBoundsMax.current = lengthBounds.max;

    if (nextMin !== lengthMinRef.current) setLengthMin(nextMin);
    if (nextMax !== lengthMaxRef.current) setLengthMax(nextMax);
  }, [lengthBounds.min, lengthBounds.max]);

  useEffect(() => {
    if (lastCodes.length) {
      setOutputMetaText(lastOutputMeta);
    }
  }, [outputFormat, separator, customSeparator, addSpaces, wordCase, lastCodes.length, lastOutputMeta]);

  const selectAllCategories = useCallback(() => {
    setSelectedCategoryIds(categories.map((category) => category.id));
  }, [categories]);

  const selectNoCategories = useCallback(() => {
    setSelectedCategoryIds([]);
  }, []);

  const toggleCategory = useCallback((id: string, checked: boolean) => {
    setSelectedCategoryIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((item) => item !== id);
    });
  }, []);

  const handleLengthInput = useCallback(
    (changed: "min" | "max", value: number) => {
      let nextMin = lengthMin;
      let nextMax = lengthMax;

      if (changed === "min") {
        nextMin = clampNumber(value, lengthBounds.min, lengthBounds.max, lengthBounds.min);
        if (nextMin > nextMax) nextMax = nextMin;
      } else {
        nextMax = clampNumber(value, lengthBounds.min, lengthBounds.max, lengthBounds.max);
        if (nextMin > nextMax) nextMin = nextMax;
      }

      setLengthMin(nextMin);
      setLengthMax(nextMax);
    },
    [lengthMin, lengthMax, lengthBounds],
  );

  const resetLengthFilter = useCallback(() => {
    setLengthMin(lengthBounds.min);
    setLengthMax(lengthBounds.max);
  }, [lengthBounds]);

  const showOutputMessage = useCallback((message: string, meta: string) => {
    setLastCodes([]);
    setLastOutputMeta(meta);
    setOutputMessage(message);
    setOutputMetaText(meta);
  }, []);

  const generateCodes = useCallback(() => {
    const normalizedDigits = clampNumber(digits, 1, 8, 2);
    const requested = clampNumber(results, 1, 1000, 20);

    setDigits(normalizedDigits);
    setResults(requested);
    setOutputMessage("");
    setOutputMetaText("");

    if (!selectedWordsUnfiltered.length) {
      showOutputMessage(
        "Select at least one category or add your own words.",
        "No codes generated.",
      );
      return;
    }

    if (!selectedWords.length) {
      showOutputMessage(
        `No selected words match the ${lengthLabel} length filter.`,
        "No codes generated.",
      );
      return;
    }

    if (!allowRepeats && requested > selectedWords.length) {
      showOutputMessage(
        "The requested count exceeds the available words. Allow repeats or request fewer codes.",
        "No codes generated.",
      );
      return;
    }

    const codes = generateCodeItems({
      words: selectedWords,
      digits: normalizedDigits,
      requested,
      randomize,
      allowRepeats,
    });

    const meta = `${codes.length} codes generated from ${selectedWords.length} available words.`;
    setLastPosition(position);
    setLastCodes(codes);
    setLastOutputMeta(meta);
    setOutputMetaText(meta);
  }, [
    digits,
    results,
    selectedWordsUnfiltered.length,
    selectedWords,
    lengthLabel,
    allowRepeats,
    randomize,
    position,
    showOutputMessage,
  ]);

  const copyOutput = useCallback(async () => {
    if (!lastOutput.trim()) {
      setOutputMetaText("Nothing generated yet.");
      return;
    }

    try {
      await copyTextToClipboard(lastOutput);
      setOutputMetaText("Copied to clipboard.");
    } catch {
      setOutputMetaText("Copy failed. Select the output and copy it manually.");
    }
  }, [lastOutput]);

  return (
    <ToolIsland className="wc-tool">
      <ToolWorkspace className="wc-tool__layout">
        <ToolPanel className="wc-panel--settings" labelledBy="wc-settings-heading">
          <ToolSectionHeading title="Settings" titleId="wc-settings-heading" />

          <details className="wc-categories">
            <summary>
              <span>Word selection</span>
              <span className="wc-categories__count">{selectedCategoryIds.length} of {categories.length} categories</span>
            </summary>
            <div className="wc-categories__body">
              <ToolInput
                label="Find a category"
                id="wc-category-search"
                type="search"
                value={categoryQuery}
                placeholder="Animals, nature, music…"
                onChange={(event) => setCategoryQuery(event.target.value)}
              />
              <ToolActionRow aria-label="Category actions">
                <ToolButton onClick={selectAllCategories}>Select all</ToolButton>
                <ToolButton onClick={selectNoCategories}>Clear selection</ToolButton>
              </ToolActionRow>
              <div className="wc-category-list">
                {visibleCategories.map((category) => (
                  <label className="wc-category" key={category.id}>
                    <input
                      type="checkbox"
                      aria-label={category.name}
                      checked={selectedCategoryIds.includes(category.id)}
                      onChange={(event) => toggleCategory(category.id, event.target.checked)}
                    />
                    <span className="wc-category__copy">
                      <span className="wc-category__name">{category.name}</span>
                      <span className="wc-category__preview">{previewWords(category)}</span>
                    </span>
                    <span className="wc-category__count">{category.words.length}</span>
                  </label>
                ))}
                {categories.length > 0 && !visibleCategories.length ? <ToolHint>No matching categories.</ToolHint> : null}
              </div>
              <ToolTextarea
                label="Extra words"
                id="wc-extra-words"
                rows={3}
                spellCheck={false}
                placeholder={"sunflower\nmoonbeam"}
                value={extraWordsText}
                onChange={(event) => setExtraWordsText(event.target.value)}
              />
              <ToolHint>Add your own words, separated by commas or new lines.</ToolHint>
            </div>
          </details>
          <ToolStatus tone={loadStatusType === "error" ? "error" : "default"}>
            {isLoading || loadStatusType === "error" ? loadStatusMessage : poolSummary}
          </ToolStatus>
          {warnings.length > 0 ? (
            <ToolStatus tone="error">Some categories could not be loaded: {warnings.join(" ")}</ToolStatus>
          ) : null}

          <ToolFormGrid className="wc-settings-grid">
            <ToolInput
              label="Digits"
              id="wc-digits"
              type="number"
              min={1}
              max={8}
              value={digits}
              onChange={(event) => setDigits(Number(event.target.value))}
            />

            <ToolSelect
              label="Digit position"
              id="wc-position"
              value={position}
              onChange={(event) => setPosition(event.target.value as DigitPosition)}
            >
              <option value="end">After word</option>
              <option value="start">Before word</option>
            </ToolSelect>

            <ToolField full className="wc-length-field">
              <div className="wc-length-heading">
                <span className="wc-length-label-row">
                  <span className="wc-field-label" id="wc-length-label">
                    Word length
                  </span>
                  {isLengthFiltered ? (
                    <button
                      type="button"
                      className="wc-length-reset"
                      aria-label="Reset word length"
                      title="Reset word length"
                      onClick={resetLengthFilter}
                    >
                      ↻
                    </button>
                  ) : null}
                </span>
                <span className="wc-length-value">{lengthLabel}</span>
              </div>

              <div className="wc-range-slider" aria-labelledby="wc-length-label">
                <div className="wc-range-track" />
                <div className="wc-range-fill" style={lengthRangeFillStyle} />
                <input
                  id="wc-min-length"
                  type="range"
                  min={lengthBounds.min}
                  max={lengthBounds.max}
                  value={lengthMin}
                  aria-label="Minimum word length"
                  style={{ zIndex: lengthMin >= lengthMax - 1 ? 3 : 2 }}
                  onChange={(event) => handleLengthInput("min", Number(event.target.value))}
                />
                <input
                  id="wc-max-length"
                  type="range"
                  min={lengthBounds.min}
                  max={lengthBounds.max}
                  value={lengthMax}
                  aria-label="Maximum word length"
                  onChange={(event) => handleLengthInput("max", Number(event.target.value))}
                />
              </div>

              <div className="wc-range-labels" aria-hidden="true">
                <span>{lengthBounds.min}</span>
                <span>{lengthBounds.max}+</span>
              </div>
            </ToolField>
          </ToolFormGrid>

          <div className="wc-checks">
            <ToolCheck
              label="Randomize word order"
              checked={randomize}
              onChange={(event) => setRandomize(event.target.checked)}
            />
            <ToolCheck
              label="Allow words to repeat"
              checked={allowRepeats}
              onChange={(event) => setAllowRepeats(event.target.checked)}
            />
          </div>

          <ToolSelect
            label="Word case"
            id="wc-word-case"
            value={wordCase}
            onChange={(event) => setWordCase(event.target.value as WordCase)}
          >
            <option value="normal">As listed</option>
            <option value="capitalize">First letter capitalized</option>
            <option value="uppercase">Uppercase</option>
            <option value="lowercase">Lowercase</option>
            <option value="random">Random capitalization</option>
          </ToolSelect>

          <ToolInput
            label="Number of codes"
            id="wc-results"
            type="number"
            min={1}
            max={1000}
            value={results}
            onChange={(event) => setResults(Number(event.target.value))}
          />

          <ToolActionRow>
            <ToolButton
              variant="primary"
              disabled={isLoading || !categories.length}
              onClick={generateCodes}
            >
              Generate
            </ToolButton>
          </ToolActionRow>
        </ToolPanel>
        <ToolPanel className="wc-panel--output" labelledBy="wc-output-heading">
          <div className="wc-output-header" ref={outputHeadingRef}>
            <div className="wc-output-title">
              <ToolSectionHeading title="Generated codes" titleId="wc-output-heading" />
              <ToolButton disabled={!lastOutput.trim()} onClick={() => void copyOutput()}>Copy codes</ToolButton>
            </div>
            <div className="wc-format-options" role="radiogroup" aria-label="Output Format">
              <label className="wc-radio-row">
                <input
                  type="radio"
                  name="wc-out-format"
                  value="column"
                  checked={outputFormat === "column"}
                  onChange={() => setOutputFormat("column")}
                />
                One per line
              </label>
              <label className="wc-radio-row">
                <input
                  type="radio"
                  name="wc-out-format"
                  value="line"
                  checked={outputFormat === "line"}
                  onChange={() => setOutputFormat("line")}
                />
                Separated line
              </label>

              {outputFormat === "line" ? (
                <div className="wc-line-controls">
                  <ToolSelect
                    label="Separator"
                    id="wc-sep"
                    value={separator}
                    onChange={(event) => setSeparator(event.target.value as SeparatorOption)}
                  >
                    <option value=",">Comma</option>
                    <option value=";">Semicolon</option>
                    <option value=".">Period</option>
                    <option value=" ">Space</option>
                    <option value="custom">Custom</option>
                  </ToolSelect>

                  {separator === "custom" ? (
                    <ToolInput
                      label="Custom"
                      id="wc-custom-sep"
                      type="text"
                      maxLength={12}
                      value={customSeparator}
                      onChange={(event) => setCustomSeparator(event.target.value)}
                    />
                  ) : null}

                  <ToolCheck
                    label="Spaces after separators"
                    checked={addSpaces}
                    onChange={(event) => setAddSpaces(event.target.checked)}
                  />
                </div>
              ) : null}
            </div>

          </div>

          <ToolStatus tone={outputMessage ? "error" : "default"}>{outputMetaText}</ToolStatus>
          {lastCodes.length ? (
            <textarea
              className="tool-code wc-output-area"
              aria-label="Generated codes"
              value={lastOutput}
              readOnly
              spellCheck={false}
            />
          ) : (
            <div className="wc-output-empty">
              <span className="wc-output-empty__sample" aria-hidden="true">word00</span>
              <p>{outputMessage || "Choose your settings and generate a batch of codes."}</p>
            </div>
          )}
        </ToolPanel>
      </ToolWorkspace>
    </ToolIsland>
  );
}
