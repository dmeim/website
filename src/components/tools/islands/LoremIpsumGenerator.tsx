import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolField,
  ToolFormGrid,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolTextarea,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
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

import "./LoremIpsumGenerator.css";

function rangeFillStyle(
  lo: number,
  hi: number,
  minBound: number,
  maxBound: number,
): { left: string; width: string } {
  const span = maxBound - minBound;
  if (span <= 0) {
    return { left: "0%", width: "100%" };
  }
  const left = ((lo - minBound) / span) * 100;
  const width = ((hi - lo) / span) * 100;
  return { left: `${left}%`, width: `${width}%` };
}

export default function LoremIpsumGenerator() {
  const [paragraphs, setParagraphs] = useState(PARAGRAPH_COUNT_DEFAULT);
  const [sentenceMin, setSentenceMin] = useState(SENTENCE_RANGE_DEFAULT[0]);
  const [sentenceMax, setSentenceMax] = useState(SENTENCE_RANGE_DEFAULT[1]);
  const [wordMin, setWordMin] = useState(WORD_RANGE_DEFAULT[0]);
  const [wordMax, setWordMax] = useState(WORD_RANGE_DEFAULT[1]);
  const [startWithLoremIpsum, setStartWithLoremIpsum] = useState(true);
  const [asHTML, setAsHTML] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [actionStatus, setActionStatus] = useState("");

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

  const paragraphFillPercent =
    ((paragraphCount - PARAGRAPH_COUNT_MIN) /
      (PARAGRAPH_COUNT_MAX - PARAGRAPH_COUNT_MIN)) *
    100;

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
    setActionStatus("Lorem ipsum refreshed.");
  }, []);

  const copy = useCallback(async () => {
    if (!loremIpsumText) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    try {
      await copyTextToClipboard(loremIpsumText);
      setActionStatus("Lorem ipsum copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }, [loremIpsumText]);

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
    <ToolIsland className="lorem-tool">
      <ToolPanel labelledBy="lorem-heading" className="lorem-tool__panel">
        <ToolSectionHeading
          title="Lorem ipsum generator"
          titleId="lorem-heading"
          description={
            <ToolHint>
              Generate filler paragraphs with tunable sentence and word ranges,
              optionally starting with the classic line or wrapping as HTML.
            </ToolHint>
          }
        />

        <ToolField
          label={`Paragraphs (${paragraphCount})`}
          htmlFor="lorem-paragraphs"
          full
        >
          <div className="lorem-range-slider">
            <div className="lorem-range-track" />
            <div
              className="lorem-range-fill"
              style={{ width: `${paragraphFillPercent}%` }}
            />
            <input
              id="lorem-paragraphs"
              type="range"
              min={PARAGRAPH_COUNT_MIN}
              max={PARAGRAPH_COUNT_MAX}
              step={1}
              value={paragraphCount}
              onChange={(event) => setParagraphs(Number(event.target.value))}
              aria-valuemin={PARAGRAPH_COUNT_MIN}
              aria-valuemax={PARAGRAPH_COUNT_MAX}
              aria-valuenow={paragraphCount}
            />
          </div>
          <div className="lorem-range-labels" aria-hidden="true">
            <span>{PARAGRAPH_COUNT_MIN}</span>
            <span>{PARAGRAPH_COUNT_MAX}</span>
          </div>
        </ToolField>

        <ToolField full className="lorem-dual-range">
          <div className="lorem-dual-heading">
            <span id="lorem-sentences-label">Sentences per paragraph</span>
            <span className="lorem-dual-value">
              {sentencesLo}–{sentencesHi}
            </span>
          </div>
          <div
            className="lorem-range-slider lorem-range-slider--dual"
            aria-labelledby="lorem-sentences-label"
          >
            <div className="lorem-range-track" />
            <div
              className="lorem-range-fill"
              style={rangeFillStyle(
                sentencesLo,
                sentencesHi,
                SENTENCE_RANGE_MIN,
                SENTENCE_RANGE_MAX,
              )}
            />
            <input
              id="lorem-sentences-min"
              type="range"
              min={SENTENCE_RANGE_MIN}
              max={SENTENCE_RANGE_MAX}
              step={1}
              value={sentencesLo}
              aria-label="Minimum sentences per paragraph"
              style={{ zIndex: sentencesLo >= sentencesHi - 1 ? 3 : 2 }}
              onChange={(event) =>
                handleSentenceBound("min", Number(event.target.value))
              }
            />
            <input
              id="lorem-sentences-max"
              type="range"
              min={SENTENCE_RANGE_MIN}
              max={SENTENCE_RANGE_MAX}
              step={1}
              value={sentencesHi}
              aria-label="Maximum sentences per paragraph"
              onChange={(event) =>
                handleSentenceBound("max", Number(event.target.value))
              }
            />
          </div>
          <div className="lorem-range-labels" aria-hidden="true">
            <span>{SENTENCE_RANGE_MIN}</span>
            <span>{SENTENCE_RANGE_MAX}</span>
          </div>
        </ToolField>

        <ToolField full className="lorem-dual-range">
          <div className="lorem-dual-heading">
            <span id="lorem-words-label">Words per sentence</span>
            <span className="lorem-dual-value">
              {wordsLo}–{wordsHi}
            </span>
          </div>
          <div
            className="lorem-range-slider lorem-range-slider--dual"
            aria-labelledby="lorem-words-label"
          >
            <div className="lorem-range-track" />
            <div
              className="lorem-range-fill"
              style={rangeFillStyle(
                wordsLo,
                wordsHi,
                WORD_RANGE_MIN,
                WORD_RANGE_MAX,
              )}
            />
            <input
              id="lorem-words-min"
              type="range"
              min={WORD_RANGE_MIN}
              max={WORD_RANGE_MAX}
              step={1}
              value={wordsLo}
              aria-label="Minimum words per sentence"
              style={{ zIndex: wordsLo >= wordsHi - 1 ? 3 : 2 }}
              onChange={(event) =>
                handleWordBound("min", Number(event.target.value))
              }
            />
            <input
              id="lorem-words-max"
              type="range"
              min={WORD_RANGE_MIN}
              max={WORD_RANGE_MAX}
              step={1}
              value={wordsHi}
              aria-label="Maximum words per sentence"
              onChange={(event) =>
                handleWordBound("max", Number(event.target.value))
              }
            />
          </div>
          <div className="lorem-range-labels" aria-hidden="true">
            <span>{WORD_RANGE_MIN}</span>
            <span>{WORD_RANGE_MAX}</span>
          </div>
        </ToolField>

        <ToolFormGrid className="lorem-toggles">
          <ToolCheck
            id="lorem-start"
            label="Start with lorem ipsum"
            toggle
            checked={startWithLoremIpsum}
            onChange={(event) => setStartWithLoremIpsum(event.target.checked)}
          />
          <ToolCheck
            id="lorem-html"
            label="As HTML"
            toggle
            checked={asHTML}
            onChange={(event) => setAsHTML(event.target.checked)}
          />
        </ToolFormGrid>

        <ToolTextarea
          id="lorem-output"
          label="Lorem ipsum"
          full
          readOnly
          rows={8}
          value={loremIpsumText}
          placeholder="Your lorem ipsum..."
          className="lorem-output"
          aria-live="polite"
          spellCheck={false}
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copy()} disabled={!loremIpsumText}>
            Copy
          </ToolButton>
          <ToolButton type="button" variant="ghost" onClick={refresh}>
            Refresh
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
