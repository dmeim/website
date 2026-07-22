import { useEffect, useMemo, useState } from "react";

import {
  ToolEmpty,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  SEARCH_DEBOUNCE_MS,
  countEmojis,
  filterEmojiGroups,
  type EmojiInfo,
} from "@/lib/tools/emoji-picker";

import "./EmojiPicker.css";

export default function EmojiPicker() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const total = countEmojis();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search]);

  const groups = useMemo(
    () => filterEmojiGroups(debouncedSearch),
    [debouncedSearch],
  );

  const matchCount = useMemo(
    () => groups.reduce((sum, group) => sum + group.emojiInfos.length, 0),
    [groups],
  );

  const isSearching = debouncedSearch.trim().length > 0;

  const copyValue = async (value: string | undefined, label: string) => {
    if (!value) {
      setActionStatus("Nothing to copy.");
      return;
    }

    try {
      await copyTextToClipboard(value);
      setActionStatus(`${label} copied.`);
    } catch {
      setActionStatus("Copy failed. Select the value and copy it manually.");
    }
  };

  return (
    <ToolIsland className="emoji-picker-tool">
      <ToolPanel
        labelledBy="emoji-picker-heading"
        className="emoji-picker-tool__panel"
      >
        <ToolSectionHeading
          title="Emoji picker"
          titleId="emoji-picker-heading"
          description={
            <ToolHint>
              Browse {total.toLocaleString()} emojis, search by name or keyword,
              and copy the character, code point, or unicode escape.
            </ToolHint>
          }
        />

        <ToolInput
          id="emoji-picker-search"
          label="Search"
          full
          value={search}
          placeholder="Search emojis (e.g. 'smile')…"
          autoComplete="off"
          spellCheck={false}
          autoFocus
          onChange={(event) => {
            setSearch(event.target.value);
            setActionStatus("");
          }}
        />

        {actionStatus ? (
          <ToolStatus tone="success" live="polite">
            {actionStatus}
          </ToolStatus>
        ) : null}
      </ToolPanel>

      {matchCount === 0 ? (
        <ToolEmpty>{isSearching ? "No results" : "No emojis loaded."}</ToolEmpty>
      ) : (
        <div className="emoji-picker-groups">
          {groups.map((group) => (
            <section
              key={group.group}
              className="emoji-picker-group"
              aria-labelledby={`emoji-group-${slugify(group.group)}`}
            >
              <h2
                id={`emoji-group-${slugify(group.group)}`}
                className="emoji-picker-group__title"
              >
                {group.group}
              </h2>

              <div className="emoji-picker-grid">
                {group.emojiInfos.map((emojiInfo) => (
                  <EmojiCard
                    key={`${emojiInfo.group}-${emojiInfo.slug}`}
                    emojiInfo={emojiInfo}
                    onCopy={copyValue}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </ToolIsland>
  );
}

function EmojiCard({
  emojiInfo,
  onCopy,
}: {
  emojiInfo: EmojiInfo;
  onCopy: (value: string | undefined, label: string) => Promise<void>;
}) {
  return (
    <article className="emoji-picker-card">
      <button
        type="button"
        className="emoji-picker-card__glyph"
        aria-label={`Copy emoji ${emojiInfo.title}`}
        onClick={() => void onCopy(emojiInfo.emoji, `Emoji ${emojiInfo.emoji}`)}
      >
        {emojiInfo.emoji}
      </button>

      <div className="emoji-picker-card__meta">
        <p className="emoji-picker-card__title" title={emojiInfo.title}>
          {emojiInfo.title}
        </p>
        <div className="emoji-picker-card__codes">
          {emojiInfo.codePoints ? (
            <button
              type="button"
              className="emoji-picker-card__code"
              title={`Copy code points ${emojiInfo.codePoints}`}
              onClick={() =>
                void onCopy(
                  emojiInfo.codePoints,
                  `Code points ${emojiInfo.codePoints}`,
                )
              }
            >
              {emojiInfo.codePoints}
            </button>
          ) : null}
          <button
            type="button"
            className="emoji-picker-card__code emoji-picker-card__code--unicode"
            title={`Copy unicode ${emojiInfo.unicode}`}
            onClick={() =>
              void onCopy(emojiInfo.unicode, `Unicode ${emojiInfo.unicode}`)
            }
          >
            {emojiInfo.unicode}
          </button>
        </div>
      </div>
    </article>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
