import { useMemo, useState, type ReactNode } from "react";

import { Badge, Panel, ReferenceList, Select, Table, ToolFrame } from "@/ui/react";
import {
  getExtensionsForMime,
  getMimeForExtension,
  listExtensions,
  listMimeInfos,
  listMimeTypes,
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
          title="Mime type to extension"
          titleId="mime-to-ext-heading"
          description="Know which file extensions are associated with a MIME type."
        >
          <Select
            id="mime-select-type"
            label="MIME type"
            value={selectedMimeType}
            onChange={(event) => setSelectedMimeType(event.target.value)}
          >
            <option value="">Select your MIME type… (ex: application/pdf)</option>
            {MIME_OPTIONS.map((mimeType) => (
              <option key={mimeType} value={mimeType}>
                {mimeType}
              </option>
            ))}
          </Select>

          {extensionsFound.length > 0 ? (
            <ResultTags
              intro={<>Extensions of files with the <code>{selectedMimeType}</code> MIME type:</>}
              tags={extensionsFound.map((extension) => `.${extension}`)}
            />
          ) : null}
        </Panel>

        <Panel
          title="File extension to mime type"
          titleId="ext-to-mime-heading"
          description="Know which MIME type is associated with a file extension."
        >
          <Select
            id="mime-select-extension"
            label="File extension"
            value={selectedExtension}
            onChange={(event) => setSelectedExtension(event.target.value)}
          >
            <option value="">Select your extension… (ex: pdf)</option>
            {EXTENSION_OPTIONS.map((extension) => (
              <option key={extension} value={extension}>
                .{extension}
              </option>
            ))}
          </Select>

          {selectedExtension && mimeTypeFound ? (
            <ResultTags
              intro={<>MIME type associated with the <code>.{selectedExtension}</code> file extension:</>}
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
          empty={{ icon: "magnifying-glass", title: "No MIME types match this filter.", size: "sm" }}
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
