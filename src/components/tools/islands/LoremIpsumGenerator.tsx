import { useCallback, useMemo, useState } from "react";

import { Button, ButtonGroup, CopyButton, FormGrid, OutputField, Panel, Slider, Switch, ToolFrame } from "@/ui/react";
import {
  PARAGRAPH_COUNT_DEFAULT,
  PARAGRAPH_COUNT_MAX,
  PARAGRAPH_COUNT_MIN,
  SENTENCE_RANGE_DEFAULT,
  SENTENCE_RANGE_MAX,
  SENTENCE_RANGE_MIN,
  WORD_RANGE_DEFAULT,
  WORD_RANGE_MAX,
  WORD_RANGE_MIN,
  clampParagraphCount,
  generateLoremIpsum,
  normalizeInclusiveRange,
  randIntFromInterval,
} from "@/lib/tools/lorem-ipsum-generator";

export default function LoremIpsumGenerator() {
  const [paragraphs, setParagraphs] = useState(PARAGRAPH_COUNT_DEFAULT);
  const [sentenceMin, setSentenceMin] = useState(SENTENCE_RANGE_DEFAULT[0]);
  const [sentenceMax, setSentenceMax] = useState(SENTENCE_RANGE_DEFAULT[1]);
  const [wordMin, setWordMin] = useState(WORD_RANGE_DEFAULT[0]);
  const [wordMax, setWordMax] = useState(WORD_RANGE_DEFAULT[1]);
  const [startWithLoremIpsum, setStartWithLoremIpsum] = useState(true);
  const [asHTML, setAsHTML] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const paragraphCount = clampParagraphCount(paragraphs);
  const [sentencesLo, sentencesHi] = normalizeInclusiveRange(
    sentenceMin,
    sentenceMax,
    SENTENCE_RANGE_MIN,
    SENTENCE_RANGE_MAX,
    SENTENCE_RANGE_DEFAULT,
  );
  const [wordsLo, wordsHi] = normalizeInclusiveRange(
    wordMin,
    wordMax,
    WORD_RANGE_MIN,
    WORD_RANGE_MAX,
    WORD_RANGE_DEFAULT,
  );

  const loremIpsumText = useMemo(() => {
    void refreshKey;
    return generateLoremIpsum({
      paragraphCount,
      sentencePerParagraph: randIntFromInterval(sentencesLo, sentencesHi),
      wordCount: randIntFromInterval(wordsLo, wordsHi),
      startWithLoremIpsum,
      asHTML,
    });
  }, [
    paragraphCount,
    sentencesLo,
    sentencesHi,
    wordsLo,
    wordsHi,
    startWithLoremIpsum,
    asHTML,
    refreshKey,
  ]);

  const refresh = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const handleSentenceBound = useCallback(
    (which: "min" | "max", next: number) => {
      if (which === "min") {
        const clamped = Math.min(next, sentenceMax);
        setSentenceMin(clamped);
      } else {
        const clamped = Math.max(next, sentenceMin);
        setSentenceMax(clamped);
      }
    },
    [sentenceMin, sentenceMax],
  );

  const handleWordBound = useCallback(
    (which: "min" | "max", next: number) => {
      if (which === "min") {
        const clamped = Math.min(next, wordMax);
        setWordMin(clamped);
      } else {
        const clamped = Math.max(next, wordMin);
        setWordMax(clamped);
      }
    },
    [wordMin, wordMax],
  );

  return (
    <ToolFrame>
      <Panel
        title="Lorem ipsum generator"
        titleId="lorem-heading"
        description="Generate filler paragraphs with tunable sentence and word ranges, optionally starting with the classic line or wrapping as HTML."
      >
        <Slider
          id="lorem-paragraphs"
          label="Paragraphs"
          min={PARAGRAPH_COUNT_MIN}
          max={PARAGRAPH_COUNT_MAX}
          step={1}
          value={paragraphCount}
          onChange={(value) => setParagraphs(Number(value))}
          marks={[PARAGRAPH_COUNT_MIN, PARAGRAPH_COUNT_MAX]}
          showValue
        />

        <Slider
          id="lorem-sentences"
          label="Sentences per paragraph"
          min={SENTENCE_RANGE_MIN}
          max={SENTENCE_RANGE_MAX}
          step={1}
          value={[sentencesLo, sentencesHi]}
          onChange={(value) => {
            if (!Array.isArray(value)) return;
            if (value[0] !== sentencesLo) handleSentenceBound("min", value[0]);
            if (value[1] !== sentencesHi) handleSentenceBound("max", value[1]);
          }}
          marks={[SENTENCE_RANGE_MIN, SENTENCE_RANGE_MAX]}
          showValue
        />

        <Slider
          id="lorem-words"
          label="Words per sentence"
          min={WORD_RANGE_MIN}
          max={WORD_RANGE_MAX}
          step={1}
          value={[wordsLo, wordsHi]}
          onChange={(value) => {
            if (!Array.isArray(value)) return;
            if (value[0] !== wordsLo) handleWordBound("min", value[0]);
            if (value[1] !== wordsHi) handleWordBound("max", value[1]);
          }}
          marks={[WORD_RANGE_MIN, WORD_RANGE_MAX]}
          showValue
        />

        <FormGrid columns="auto">
          <Switch
            id="lorem-start"
            label="Start with lorem ipsum"
            checked={startWithLoremIpsum}
            onChange={(event) => setStartWithLoremIpsum(event.target.checked)}
          />
          <Switch id="lorem-html" label="As HTML" checked={asHTML} onChange={(event) => setAsHTML(event.target.checked)} />
        </FormGrid>

        <OutputField
          id="lorem-output"
          label="Lorem ipsum"
          multiline
          rows={8}
          value={loremIpsumText}
          placeholder="Your lorem ipsum..."
          copy={false}
          mono={false}
        />

        <ButtonGroup>
          <CopyButton value={loremIpsumText} disabled={!loremIpsumText} variant="primary" />
          <Button variant="ghost" iconStart="arrows-clockwise" onClick={refresh}>
            Refresh
          </Button>
        </ButtonGroup>
      </Panel>
    </ToolFrame>
  );
}
