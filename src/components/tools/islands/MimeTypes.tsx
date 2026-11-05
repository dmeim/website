import { useMemo, useState, type ReactNode } from "react";

import { Badge, Input, Panel, ReferenceList, Table, ToolFrame } from "@/ui/react";
import {
  getExtensionsForMime,
  getMimeForExtension,
  listExtensions,
  listMimeInfos,
  listMimeTypes,
  normalizeExtension,
} from "@/lib/tools/mime-types";
import "./MimeTypes.css";

const MIME_OPTIONS = listMimeTypes();
const EXTENSION_OPTIONS = listExtensions();
const MIME_INFOS = listMimeInfos();

export default function MimeTypes() {
  const [selectedMimeType, setSelectedMimeType] = useState("");
  const [selectedExtension, setSelectedExtension] = useState("");
  const [tableFilter, setTableFilter] = useState("");

  const extensionsFound = useMemo(
    () => (selectedMimeType ? getExtensionsForMime(selectedMimeType) : []),
    [selectedMimeType],
  );

  const mimeTypeFound = useMemo(
    () => (selectedExtension ? getMimeForExtension(selectedExtension) : undefined),
    [selectedExtension],
  );

  const mimeUnknown = selectedMimeType.trim() !== "" && extensionsFound.length === 0;
  const extensionUnknown = selectedExtension.trim() !== "" && !mimeTypeFound;

  const filteredInfos = useMemo(() => {
    const query = tableFilter.trim().toLowerCase();
    if (!query) return MIME_INFOS;
    return MIME_INFOS.filter(
      (row) =>
        row.mimeType.toLowerCase().includes(query) ||
        row.extensions.some((ext) => ext.toLowerCase().includes(query) || `.${ext}`.includes(query)),
    );
  }, [tableFilter]);

  return (
    <ToolFrame layout="stack">
      <ToolFrame layout="split" stagger>
        <Panel
          title="MIME type to extension"
          titleId="mime-to-ext-heading"
          description="Know which file extensions are associated with a MIME type."
        >
          <Input
            id="mime-select-type"
            label="MIME type"
            list="mime-type-options"
            autoComplete="off"
            spellCheck={false}
            clearable
            value={selectedMimeType}
            placeholder="Search your MIME type… (ex: application/pdf)"
            error={mimeUnknown ? "No extensions are known for this MIME type. Pick one from the list." : undefined}
            onChange={(event) => setSelectedMimeType(event.target.value)}
          />
          <datalist id="mime-type-options">
            {MIME_OPTIONS.map((mimeType) => (
              <option key={mimeType} value={mimeType} />
            ))}
          </datalist>

          {extensionsFound.length > 0 ? (
            <ResultTags
              intro={<>Extensions of files with the <code>{selectedMimeType.trim()}</code> MIME type:</>}
              tags={extensionsFound.map((extension) => `.${extension}`)}
            />
          ) : null}
        </Panel>

        <Panel
          title="File extension to MIME type"
          titleId="ext-to-mime-heading"
          description="Know which MIME type is associated with a file extension."
        >
          <Input
            id="mime-select-extension"
            label="File extension"
            list="mime-extension-options"
            autoComplete="off"
            spellCheck={false}
            clearable
            value={selectedExtension}
            placeholder="Search your extension… (ex: pdf)"
            error={extensionUnknown ? "This extension is not in the list. Check the spelling, or filter the reference below." : undefined}
            onChange={(event) => setSelectedExtension(event.target.value)}
          />
          <datalist id="mime-extension-options">
            {EXTENSION_OPTIONS.map((extension) => (
              <option key={extension} value={`.${extension}`} />
            ))}
          </datalist>

          {mimeTypeFound ? (
            <ResultTags
              intro={<>MIME type associated with the <code>.{normalizeExtension(selectedExtension)}</code> file extension:</>}
              tags={[mimeTypeFound]}
            />
          ) : null}
        </Panel>
      </ToolFrame>

      <Panel
        title="MIME types reference"
        titleId="mime-table-heading"
        description={`Full MIME type ↔ extension map from mime-db (${MIME_INFOS.length} types).`}
      >
        <ReferenceList
          searchLabel="Filter by MIME type or extension…"
          query={tableFilter}
          onQueryChange={setTableFilter}
          count={filteredInfos.length}
          empty={{ icon: "magnifying-glass", title: "No MIME types match this filter", size: "sm" }}
        >
          <Table caption="MIME types and their extensions" captionHidden density="compact" stickyHeader>
            <thead>
              <tr>
                <th scope="col">MIME types</th>
                <th scope="col">Extensions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInfos.map(({ mimeType, extensions }) => (
                <tr key={mimeType}>
                  <td>
                    <code>{mimeType}</code>
                  </td>
                  <td>
                    <TagRow tags={extensions.map((extension) => `.${extension}`)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ReferenceList>
      </Panel>
    </ToolFrame>
  );
}

function ResultTags({ intro, tags }: { intro: ReactNode; tags: string[] }) {
  return (
    <div className="mime-result" aria-live="polite">
      <p className="mime-result__copy">{intro}</p>
      <TagRow tags={tags} tone="accent" />
    </div>
  );
}

function TagRow({ tags, tone = "neutral" }: { tags: string[]; tone?: "neutral" | "accent" }) {
  return (
    <div className="mime-tags" role="list">
      {tags.map((tag) => (
        <Badge key={tag} tone={tone} size="sm" role="listitem" className="mime-tag">
          {tag}
        </Badge>
      ))}
    </div>
  );
}
