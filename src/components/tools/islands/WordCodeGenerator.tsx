import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  Button,
  ButtonGroup,
  Checkbox,
  CopyButton,
  Disclosure,
  EmptyState,
  FormGrid,
  IconButton,
  Input,
  Notice,
  OutputField,
  Panel,
  RadioGroup,
  Select,
  Slider,
  Stack,
  Textarea,
  ToolFrame,
} from "@/ui/react";
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
  const [loadStatusMessage, setLoadStatusMessage] = useState(
    "Loading word categories…",
  );
  const [loadStatusType, setLoadStatusType] = useState<
    "success" | "error" | ""
  >("");

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
  const [lastOutputMeta, setLastOutputMeta] = useState(
    "Your generated codes will appear here.",
  );
  const [outputMetaText, setOutputMetaText] = useState(
    "Your generated codes will appear here.",
  );
  const [outputMessage, setOutputMessage] = useState("");

  const outputHeadingRef = useRef<HTMLElement>(null);
  const previousBoundsMax = useRef<number | null>(null);
  const lengthMinRef = useRef(lengthMin);
  const lengthMaxRef = useRef(lengthMax);
  lengthMinRef.current = lengthMin;
  lengthMaxRef.current = lengthMax;

  const visibleCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    return categories.filter((category) =>
      `${category.name} ${category.description} ${category.words.join(" ")}`
        .toLowerCase()
        .includes(query),
    );
  }, [categories, categoryQuery]);

  useEffect(() => {
    if (!lastCodes.length && !outputMessage) return;
    const heading = outputHeadingRef.current;
    const bounds = heading?.getBoundingClientRect();
    if (bounds && bounds.top >= 0 && bounds.bottom <= window.innerHeight)
      return;
    heading?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [lastCodes, outputMessage]);

  const extraWords = useMemo(
    () => parseExtraWords(extraWordsText),
    [extraWordsText],
  );

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
    () =>
      uniqueWords([
        ...categories.flatMap((category) => category.words),
        ...extraWords,
      ]),
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
  }, [
    lastCodes,
    outputFormat,
    separator,
    customSeparator,
    addSpaces,
    lastPosition,
    wordCase,
  ]);

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
          "Could not load word categories. Make sure the category JSON files are present in the WordCode source folder.",
        );
        setOutputMetaText("Category loading failed.");
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
  }, [
    outputFormat,
    separator,
    customSeparator,
    addSpaces,
    wordCase,
    lastCodes.length,
    lastOutputMeta,
  ]);

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
        nextMin = clampNumber(
          value,
          lengthBounds.min,
          lengthBounds.max,
          lengthBounds.min,
        );
        if (nextMin > nextMax) nextMax = nextMin;
      } else {
        nextMax = clampNumber(
          value,
          lengthBounds.min,
          lengthBounds.max,
          lengthBounds.max,
        );
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

  return (
    <ToolFrame layout="split">
      <Panel title="Settings" titleId="wc-settings-heading">
        <Disclosure
          summary="Word selection"
          meta={`${selectedCategoryIds.length} of ${categories.length} categories`}
        >
          <Stack gap="md">
            <Input
              label="Find a category"
              id="wc-category-search"
              type="search"
              value={categoryQuery}
              placeholder="Animals, nature, music…"
              onChange={(event) => setCategoryQuery(event.target.value)}
            />
            <ButtonGroup label="Category actions">
              <Button size="sm" onClick={selectAllCategories}>
                Select all
              </Button>
              <Button size="sm" onClick={selectNoCategories}>
                Clear selection
              </Button>
            </ButtonGroup>
            <div className="wc-category-list">
              {visibleCategories.map((category) => (
                <Checkbox
                  key={category.id}
                  aria-label={category.name}
                  label={
                    <span className="wc-category__label">
                      <span>{category.name}</span>
                      <Badge>{category.words.length}</Badge>
                    </span>
                  }
                  description={previewWords(category)}
                  checked={selectedCategoryIds.includes(category.id)}
                  onChange={(event) =>
                    toggleCategory(category.id, event.target.checked)
                  }
                />
              ))}
              {categories.length > 0 && !visibleCategories.length ? (
                <p className="wc-category-empty">No matching categories.</p>
              ) : null}
            </div>
            <Textarea
              label="Extra words"
              id="wc-extra-words"
              rows={3}
              spellCheck={false}
              placeholder={"sunflower\nmoonbeam"}
              hint="Add your own words, separated by commas or new lines."
              value={extraWordsText}
              onChange={(event) => setExtraWordsText(event.target.value)}
            />
          </Stack>
        </Disclosure>
        <Notice
          tone={loadStatusType === "error" ? "danger" : "neutral"}
          live="polite"
        >
          {isLoading || loadStatusType === "error"
            ? loadStatusMessage
            : poolSummary}
        </Notice>
        {warnings.length > 0 ? (
          <Notice tone="danger">
            Some categories could not be loaded: {warnings.join(" ")}
          </Notice>
        ) : null}

        <FormGrid columns={2}>
          <Input
            label="Digits"
            id="wc-digits"
            type="number"
            min={1}
            max={8}
            value={digits}
            onChange={(event) => setDigits(Number(event.target.value))}
          />
          <Select
            label="Digit position"
            id="wc-position"
            value={position}
            options={[
              { value: "end", label: "After word" },
              { value: "start", label: "Before word" },
            ]}
            onChange={(event) =>
              setPosition(event.target.value as DigitPosition)
            }
          />
        </FormGrid>

        <div className="wc-length">
          <Slider
            label="Word length"
            id="wc-length"
            min={lengthBounds.min}
            max={lengthBounds.max}
            value={[lengthMin, lengthMax]}
            showValue
            formatValue={(value) =>
              value === lengthBounds.max ? `${value}+` : String(value)
            }
            onChange={(next) => {
              if (!Array.isArray(next)) return;
              if (next[0] !== lengthMin) handleLengthInput("min", next[0]);
              else if (next[1] !== lengthMax) handleLengthInput("max", next[1]);
            }}
          />
          {isLengthFiltered ? (
            <IconButton
              icon="arrows-clockwise"
              label="Reset word length"
              size="sm"
              variant="ghost"
              onClick={resetLengthFilter}
            />
          ) : null}
        </div>

        <Stack gap="xs">
          <Checkbox
            label="Randomize word order"
            checked={randomize}
            onChange={(event) => setRandomize(event.target.checked)}
          />
          <Checkbox
            label="Allow words to repeat"
            checked={allowRepeats}
            onChange={(event) => setAllowRepeats(event.target.checked)}
          />
        </Stack>

        <FormGrid columns={2}>
          <Select
            label="Word case"
            id="wc-word-case"
            value={wordCase}
            options={[
              { value: "normal", label: "As listed" },
              { value: "capitalize", label: "First letter capitalized" },
              { value: "uppercase", label: "Uppercase" },
              { value: "lowercase", label: "Lowercase" },
              { value: "random", label: "Random capitalization" },
            ]}
            onChange={(event) => setWordCase(event.target.value as WordCase)}
          />
          <Input
            label="Number of codes"
            id="wc-results"
            type="number"
            min={1}
            max={1000}
            value={results}
            onChange={(event) => setResults(Number(event.target.value))}
          />
        </FormGrid>

        <ButtonGroup>
          <Button
            variant="primary"
            iconStart="arrow-right"
            disabled={isLoading || !categories.length}
            onClick={generateCodes}
          >
            Generate
          </Button>
        </ButtonGroup>
      </Panel>

      <Panel
        ref={outputHeadingRef}
        title="Generated codes"
        titleId="wc-output-heading"
        actions={
          lastOutput.trim() ? (
            <CopyButton value={lastOutput} label="Copy codes" size="sm" />
          ) : (
            <Button size="sm" iconStart="copy" disabled>
              Copy codes
            </Button>
          )
        }
      >
        <RadioGroup
          name="wc-out-format"
          legend="Output format"
          orientation="horizontal"
          value={outputFormat}
          options={[
            { value: "column", label: "One per line" },
            { value: "line", label: "Separated line" },
          ]}
          onChange={(value) => setOutputFormat(value as OutputFormat)}
        />

        {outputFormat === "line" ? (
          <FormGrid columns={2}>
            <Select
              label="Separator"
              id="wc-sep"
              value={separator}
              options={[
                { value: ",", label: "Comma" },
                { value: ";", label: "Semicolon" },
                { value: ".", label: "Period" },
                { value: " ", label: "Space" },
                { value: "custom", label: "Custom" },
              ]}
              onChange={(event) =>
                setSeparator(event.target.value as SeparatorOption)
              }
            />
            {separator === "custom" ? (
              <Input
                label="Custom"
                id="wc-custom-sep"
                type="text"
                mono
                maxLength={12}
                value={customSeparator}
                onChange={(event) => setCustomSeparator(event.target.value)}
              />
            ) : null}
            <Checkbox
              label="Spaces after separators"
              checked={addSpaces}
              onChange={(event) => setAddSpaces(event.target.checked)}
            />
          </FormGrid>
        ) : null}

        {outputMetaText ? (
          <Notice tone={outputMessage ? "danger" : "neutral"} live="polite">
            {outputMetaText}
          </Notice>
        ) : null}
        {lastCodes.length ? (
          <OutputField
            id="wc-output"
            label="Generated codes"
            multiline
            rows={12}
            copy={false}
            value={lastOutput}
          />
        ) : (
          <EmptyState
            icon="list"
            size="sm"
            title="word00"
            description={
              outputMessage ||
              "Choose your settings and generate a batch of codes."
            }
          />
        )}
      </Panel>
    </ToolFrame>
  );
}
