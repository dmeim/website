import { useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ButtonGroup,
  CopyButton,
  IconButton,
  Input,
  Notice,
  Panel,
  Table,
  ToolFrame,
} from "@/ui/react";
import {
  EMPTY_RESET_SUITES,
  RESULT_HEADER,
  buildBenchmarkResults,
  createSuite,
  formatBulletList,
  formatMarkdownTable,
  readStoredSuites,
  readStoredUnit,
  writeStoredSuites,
  writeStoredUnit,
  type BenchmarkSuite,
} from "@/lib/tools/benchmark-builder";

import "./BenchmarkBuilder.css";

function measureToInputValue(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseMeasureInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function measureInputId(suiteIndex: number, measureIndex: number): string {
  return `bb-suite-${suiteIndex}-measure-${measureIndex}`;
}

function SuiteMeasures({
  suiteIndex,
  values,
  onChange,
}: {
  suiteIndex: number;
  values: (number | null)[];
  onChange: (next: (number | null)[]) => void;
}) {
  const updateAt = (index: number, raw: string) => {
    const next = [...values];
    next[index] = parseMeasureInput(raw);
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const focusMeasure = (index: number) => {
    requestAnimationFrame(() => {
      document.getElementById(measureInputId(suiteIndex, index))?.focus();
    });
  };

  const addValue = () => {
    const nextIndex = values.length;
    onChange([...values, null]);
    focusMeasure(nextIndex);
  };

  const onEnter = (index: number) => {
    if (index === values.length - 1) {
      addValue();
      return;
    }
    focusMeasure(index + 1);
  };

  return (
    <div className="bb-measures" role="group" aria-label="Suite values">
      {values.map((value, index) => (
        <div key={`${suiteIndex}-m-${index}`} className="bb-measure-row">
          <Input
            id={measureInputId(suiteIndex, index)}
            label={`Measure ${index + 1}`}
            type="number"
            inputMode="decimal"
            step="any"
            value={measureToInputValue(value)}
            placeholder="Set your measure…"
            onChange={(event) => updateAt(index, event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onEnter(index);
              }
            }}
            data-testid={measureInputId(suiteIndex, index)}
            labelHidden
            mono
          />
          <IconButton
            icon="x"
            label={`Delete measure ${index + 1}`}
            onClick={() => removeAt(index)}
          />
        </div>
      ))}
      <ButtonGroup>
        <Button
          variant="ghost"
          size="sm"
          iconStart="plus"
          onClick={addValue}
          data-testid={`bb-add-measure-${suiteIndex}`}
        >
          Add a measure
        </Button>
      </ButtonGroup>
    </div>
  );
}

export default function BenchmarkBuilder() {
  const [suites, setSuites] = useState<BenchmarkSuite[]>(() =>
    readStoredSuites(),
  );
  const [unit, setUnit] = useState(() => readStoredUnit());
  const [actionStatus, setActionStatus] = useState("");
  const skipPersist = useRef(true);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    writeStoredSuites(suites);
    writeStoredUnit(unit);
  }, [suites, unit]);

  const results = useMemo(
    () => buildBenchmarkResults(suites, unit),
    [suites, unit],
  );

  const updateSuite = (index: number, patch: Partial<BenchmarkSuite>) => {
    setSuites((prev) =>
      prev.map((suite, i) => (i === index ? { ...suite, ...patch } : suite)),
    );
    setActionStatus("");
  };

  const deleteSuite = (index: number) => {
    setSuites((prev) => prev.filter((_, i) => i !== index));
    setActionStatus("");
  };

  const addSuiteAfter = (index: number) => {
    setSuites((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, createSuite(prev.length));
      return next;
    });
    setActionStatus("");
  };

  const resetSuites = () => {
    setSuites(structuredClone(EMPTY_RESET_SUITES));
    setActionStatus("Suites reset.");
  };

  return (
    <ToolFrame>
      <Panel
        title="Benchmark builder"
        titleId="bb-heading"
        description="Compare execution time (or any numeric samples) across suites, ranked by mean with variance and deltas vs the best."
      >
        <div className="bb-suites" aria-label="Benchmark suites">
          {suites.map((suite, index) => (
            <section
              key={`suite-${index}`}
              aria-labelledby={`bb-suite-${index}-heading`}
              className="bb-suite"
            >
              <h3 id={`bb-suite-${index}-heading`} className="bb-suite__title">
                Suite {index + 1}
              </h3>
              <Input
                id={`bb-suite-${index}-name`}
                label="Suite name"
                value={suite.title}
                placeholder="Suite name…"
                clearable
                onChange={(event) =>
                  updateSuite(index, { title: event.target.value })
                }
                data-testid={`bb-suite-${index}-name`}
              />
              <SuiteMeasures
                suiteIndex={index}
                values={suite.data}
                onChange={(data) => updateSuite(index, { data })}
              />
              <ButtonGroup label="Suite actions">
                {suites.length > 1 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconStart="trash"
                    onClick={() => deleteSuite(index)}
                    data-testid={`bb-delete-suite-${index}`}
                  >
                    Delete suite
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  iconStart="plus"
                  onClick={() => addSuiteAfter(index)}
                  data-testid={`bb-add-suite-${index}`}
                >
                  Add suite
                </Button>
              </ButtonGroup>
            </section>
          ))}
        </div>
      </Panel>

      <Panel
        title="Results"
        titleId="bb-results-heading"
        description="Suites ranked by ascending mean. Slower suites show delta and ratio versus the best."
        actions={
          <Button iconStart="arrows-clockwise" onClick={resetSuites} data-testid="bb-reset">
            Reset suites
          </Button>
        }
      >
        <div className="bb-controls">
          <Input
            id="bb-unit"
            label="Unit"
            value={unit}
            placeholder="Unit (eg: ms)"
            onChange={(event) => {
              setUnit(event.target.value);
              setActionStatus("");
            }}
            data-testid="bb-unit"
          />
        </div>

        <Table caption="Benchmark results" captionHidden data-testid="bb-results-table">
          <thead>
            <tr>
              <th scope="col">{RESULT_HEADER.position}</th>
              <th scope="col">{RESULT_HEADER.title}</th>
              <th scope="col">{RESULT_HEADER.size}</th>
              <th scope="col">{RESULT_HEADER.mean}</th>
              <th scope="col">{RESULT_HEADER.variance}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={`${row.position}-${row.title}`}>
                <td>{row.position}</td>
                <td>{row.title}</td>
                <td>{row.size}</td>
                <td>{row.mean}</td>
                <td>{row.variance}</td>
              </tr>
            ))}
          </tbody>
        </Table>

        <ButtonGroup label="Export actions">
          <CopyButton
            variant="primary"
            label="Copy as markdown table"
            getValue={() => formatMarkdownTable(results)}
            data-testid="bb-copy-markdown"
          />
          <CopyButton
            label="Copy as bullet list"
            getValue={() => formatBulletList(results)}
            data-testid="bb-copy-bullets"
          />
        </ButtonGroup>

        {actionStatus ? <Notice live="polite">{actionStatus}</Notice> : null}
      </Panel>
    </ToolFrame>
  );
}
