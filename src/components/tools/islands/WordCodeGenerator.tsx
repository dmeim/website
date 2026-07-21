import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";

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
  const [loadStatusMessage, setLoadStatusMessage] = useState("Loading Category JSON Files…");
  const [loadStatusType, setLoadStatusType] = useState<"success" | "error" | "">("");

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [extraWordsText, setExtraWordsText] = useState("");
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
  const [lastOutputMeta, setLastOutputMeta] = useState("Generated Codes Will Appear Here.");
  const [outputMetaText, setOutputMetaText] = useState("Generated Codes Will Appear Here.");
  const [outputMessage, setOutputMessage] = useState("");

  const previousBoundsMax = useRef<number | null>(null);
  const lengthMinRef = useRef(lengthMin);
  const lengthMaxRef = useRef(lengthMax);
  lengthMinRef.current = lengthMin;
  lengthMaxRef.current = lengthMax;

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
      return "No Words Selected. Choose At Least One Category Or Add Optional Extra Words.";
    }

    const selectedCount = selectedCategoryIds.length;
    const extraCount = extraWords.length;
    const categoryText = `${selectedCount} ${selectedCount === 1 ? "Category" : "Categories"} Selected`;
    const extraText = extraCount
      ? ` + ${extraCount} Extra ${extraCount === 1 ? "Word" : "Words"}`
      : "";

    if (!selectedWords.length) {
      return `${categoryText}${extraText} • No Words Match The ${lengthLabel} Length Filter.`;
    }

    if (selectedWords.length === selectedWordsUnfiltered.length) {
      return `${categoryText}${extraText} • ${selectedWords.length} Unique Words Available.`;
    }

    return `${categoryText}${extraText} • ${selectedWords.length} Of ${selectedWordsUnfiltered.length} Words Match The ${lengthLabel} Length Filter.`;
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

  const outputText = lastCodes.length ? lastOutput : outputMessage;

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setLoadStatusMessage("Loading Category JSON Files…");
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
          `Loaded ${loaded.categories.length} Categories / ${loaded.totalUniqueWords} Unique Words.`,
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
        "Select At Least One Word Category Or Add Optional Extra Words.",
        "No Codes Generated.",
      );
      return;
    }

    if (!selectedWords.length) {
      showOutputMessage(
        `No Selected Words Match The ${lengthLabel} Length Filter.`,
        "No Codes Generated.",
      );
      return;
    }

    if (!allowRepeats && requested > selectedWords.length) {
      showOutputMessage(
        "Cannot Generate More Results Than Unique Words When Repeats Are Off.",
        "No Codes Generated.",
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

    const meta = `${codes.length} Codes Generated From ${selectedWords.length} Available Words.`;
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
      setOutputMetaText("Nothing Generated Yet.");
      return;
    }

    try {
      await copyTextToClipboard(lastOutput);
      setOutputMetaText("Copied To Clipboard.");
    } catch {
      setOutputMetaText("Copy Failed. Select The Output And Copy It Manually.");
    }
  }, [lastOutput]);

  return (
    <div className="wc-tool">
      <div className="wc-tool__layout">
        <section className="wc-panel" aria-labelledby="wc-categories-heading">
          <div className="wc-panel__heading">
            <h2 id="wc-categories-heading">Word Categories</h2>
            <p
              className={`wc-status${loadStatusType ? ` wc-status--${loadStatusType}` : ""}`}
              role="status"
            >
              {loadStatusMessage}
            </p>
          </div>

          <div className="wc-toolbar" aria-label="Category actions">
            <button type="button" className="wc-btn wc-btn--secondary" onClick={selectAllCategories}>
              Select All
            </button>
            <button type="button" className="wc-btn wc-btn--secondary" onClick={selectNoCategories}>
              Select None
            </button>
            <p className="wc-pool-summary">{poolSummary}</p>
          </div>

          <div className="wc-category-wrap" aria-live="polite">
            {!categories.length ? (
              <p className="wc-hint">No Categories Loaded Yet.</p>
            ) : (
              <table className="wc-category-table">
                <thead>
                  <tr>
                    <th className="wc-category-table__name" scope="col">
                      Name
                    </th>
                    <th className="wc-category-table__count" scope="col">
                      Count
                    </th>
                    <th className="wc-category-table__desc" scope="col">
                      Description
                    </th>
                    <th className="wc-category-table__preview" scope="col">
                      Preview
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <label className="wc-category-name" htmlFor={`wc-category-${category.id}`}>
                          <input
                            id={`wc-category-${category.id}`}
                            type="checkbox"
                            checked={selectedCategoryIds.includes(category.id)}
                            onChange={(event: ChangeEvent<HTMLInputElement>) =>
                              toggleCategory(category.id, event.target.checked)
                            }
                          />
                          <span>{category.name}</span>
                        </label>
                      </td>
                      <td>
                        <span className="wc-count-pill">{category.words.length}</span>
                      </td>
                      <td>
                        <p className="wc-category-description">
                          {category.description || `Loaded From ${category.file}`}
                        </p>
                      </td>
                      <td>
                        <div className="wc-word-preview">{previewWords(category)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {warnings.length > 0 ? (
            <p className="wc-warning">
              Some Category Files Were Skipped: {warnings.join(" ")}
            </p>
          ) : null}

          <details className="wc-details">
            <summary>Optional Extra Words</summary>
            <p className="wc-hint">
              Use This Only For One-Off Additions. Put Each Word On Its Own Line Or Separate Words
              With Commas.
            </p>
            <label className="wc-field-label" htmlFor="wc-extra-words">
              Extra Words
            </label>
            <textarea
              id="wc-extra-words"
              spellCheck={false}
              placeholder={"sunflower\nmoonbeam"}
              value={extraWordsText}
              onChange={(event) => setExtraWordsText(event.target.value)}
            />
          </details>
        </section>

        <section className="wc-panel" aria-labelledby="wc-settings-heading">
          <h2 id="wc-settings-heading">Generation Settings</h2>

          <div className="wc-settings-grid">
            <div className="wc-field">
              <label className="wc-field-label" htmlFor="wc-digits">
                Digits
              </label>
              <input
                id="wc-digits"
                type="number"
                min={1}
                max={8}
                value={digits}
                onChange={(event) => setDigits(Number(event.target.value))}
              />
            </div>

            <div className="wc-field">
              <label className="wc-field-label" htmlFor="wc-position">
                Digits Position
              </label>
              <select
                id="wc-position"
                value={position}
                onChange={(event) => setPosition(event.target.value as DigitPosition)}
              >
                <option value="end">At End: Word00</option>
                <option value="start">At Start: 00Word</option>
              </select>
            </div>

            <div className="wc-field wc-field--full">
              <div className="wc-length-heading">
                <span className="wc-length-label-row">
                  <span className="wc-field-label" id="wc-length-label">
                    Word Length
                  </span>
                  {isLengthFiltered ? (
                    <button
                      type="button"
                      className="wc-length-reset"
                      aria-label="Reset Word Length"
                      title="Reset Word Length"
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
                  aria-label="Minimum Word Length"
                  style={{ zIndex: lengthMin >= lengthMax - 1 ? 3 : 2 }}
                  onChange={(event) => handleLengthInput("min", Number(event.target.value))}
                />
                <input
                  id="wc-max-length"
                  type="range"
                  min={lengthBounds.min}
                  max={lengthBounds.max}
                  value={lengthMax}
                  aria-label="Maximum Word Length"
                  onChange={(event) => handleLengthInput("max", Number(event.target.value))}
                />
              </div>

              <div className="wc-range-labels" aria-hidden="true">
                <span>{lengthBounds.min}</span>
                <span>{lengthBounds.max}+</span>
              </div>
            </div>
          </div>

          <div className="wc-checks">
            <label className="wc-check-row">
              <input
                type="checkbox"
                checked={randomize}
                onChange={(event) => setRandomize(event.target.checked)}
              />
              Randomize Word Order
            </label>
            <label className="wc-check-row">
              <input
                type="checkbox"
                checked={allowRepeats}
                onChange={(event) => setAllowRepeats(event.target.checked)}
              />
              Allow Words To Repeat
            </label>
          </div>

          <div className="wc-field">
            <label className="wc-field-label" htmlFor="wc-word-case">
              Word Case
            </label>
            <select
              id="wc-word-case"
              value={wordCase}
              onChange={(event) => setWordCase(event.target.value as WordCase)}
            >
              <option value="normal">As Listed</option>
              <option value="capitalize">First Letter Capitalized</option>
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="random">Random Letter Capitalization</option>
            </select>
          </div>

          <div className="wc-field">
            <label className="wc-field-label" htmlFor="wc-results">
              Results
            </label>
            <input
              id="wc-results"
              type="number"
              min={1}
              max={1000}
              value={results}
              onChange={(event) => setResults(Number(event.target.value))}
            />
          </div>

          <div className="wc-actions">
            <button
              type="button"
              className="wc-btn wc-btn--primary"
              disabled={isLoading || !categories.length}
              onClick={generateCodes}
            >
              Generate
            </button>
          </div>
        </section>
      </div>

      <section className="wc-panel wc-panel--output" aria-labelledby="wc-output-heading">
        <div className="wc-output-header">
          <h2 id="wc-output-heading">Output</h2>
          <div className="wc-format-options" role="radiogroup" aria-label="Output Format">
            <label className="wc-radio-row">
              <input
                type="radio"
                name="wc-out-format"
                value="column"
                checked={outputFormat === "column"}
                onChange={() => setOutputFormat("column")}
              />
              Column / Newline
            </label>
            <label className="wc-radio-row">
              <input
                type="radio"
                name="wc-out-format"
                value="line"
                checked={outputFormat === "line"}
                onChange={() => setOutputFormat("line")}
              />
              Single Line With Separator
            </label>

            {outputFormat === "line" ? (
              <div className="wc-line-controls">
                <div className="wc-field">
                  <label className="wc-field-label" htmlFor="wc-sep">
                    Separator
                  </label>
                  <select
                    id="wc-sep"
                    value={separator}
                    onChange={(event) => setSeparator(event.target.value as SeparatorOption)}
                  >
                    <option value=",">Comma</option>
                    <option value=";">Semicolon</option>
                    <option value=".">Period</option>
                    <option value=" ">Space</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {separator === "custom" ? (
                  <div className="wc-field">
                    <label className="wc-field-label" htmlFor="wc-custom-sep">
                      Custom
                    </label>
                    <input
                      id="wc-custom-sep"
                      type="text"
                      maxLength={12}
                      value={customSeparator}
                      onChange={(event) => setCustomSeparator(event.target.value)}
                    />
                  </div>
                ) : null}

                <label className="wc-check-row">
                  <input
                    type="checkbox"
                    checked={addSpaces}
                    onChange={(event) => setAddSpaces(event.target.checked)}
                  />
                  Add Spaces After Separators
                </label>
              </div>
            ) : null}
          </div>

          <button type="button" className="wc-btn wc-btn--secondary" onClick={() => void copyOutput()}>
            Copy To Clipboard
          </button>
        </div>

        <p className="wc-meta">{outputMetaText}</p>
        <div className="wc-output-area" aria-live="polite">
          {outputText}
        </div>
      </section>
    </div>
  );
}
