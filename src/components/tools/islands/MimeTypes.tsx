import { useMemo, useState } from "react";

import {
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolSelect,
  ToolWorkspace,
} from "@/components/tools/ui";
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
    <ToolIsland className="mime-tool">
      <ToolWorkspace className="mime-tool__workspace" stagger>
        <ToolPanel labelledBy="mime-to-ext-heading" className="mime-tool__panel">
          <ToolSectionHeading
            title="Mime type to extension"
            titleId="mime-to-ext-heading"
            description={
              <ToolHint>
                Know which file extensions are associated with a MIME type.
              </ToolHint>
            }
          />

          <ToolSelect
            id="mime-select-type"
            label="MIME type"
            full
            value={selectedMimeType}
            onChange={(event) => setSelectedMimeType(event.target.value)}
          >
            <option value="">Select your MIME type… (ex: application/pdf)</option>
            {MIME_OPTIONS.map((mimeType) => (
              <option key={mimeType} value={mimeType}>
                {mimeType}
              </option>
            ))}
          </ToolSelect>

          {extensionsFound.length > 0 ? (
            <div className="mime-result" aria-live="polite">
              <p className="mime-result__copy">
                Extensions of files with the{" "}
                <span className="mime-tag">{selectedMimeType}</span> MIME type:
              </p>
              <div className="mime-tags" role="list">
                {extensionsFound.map((extension) => (
                  <span key={extension} className="mime-tag mime-tag--accent" role="listitem">
                    .{extension}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </ToolPanel>

        <ToolPanel labelledBy="ext-to-mime-heading" className="mime-tool__panel">
          <ToolSectionHeading
            title="File extension to mime type"
            titleId="ext-to-mime-heading"
            description={
              <ToolHint>
                Know which MIME type is associated with a file extension.
              </ToolHint>
            }
          />

          <ToolSelect
            id="mime-select-extension"
            label="File extension"
            full
            value={selectedExtension}
            onChange={(event) => setSelectedExtension(event.target.value)}
          >
            <option value="">Select your extension… (ex: pdf)</option>
            {EXTENSION_OPTIONS.map((extension) => (
              <option key={extension} value={extension}>
                .{extension}
              </option>
            ))}
          </ToolSelect>

          {selectedExtension && mimeTypeFound ? (
            <div className="mime-result" aria-live="polite">
              <p className="mime-result__copy">
                MIME type associated with the{" "}
                <span className="mime-tag">.{selectedExtension}</span> file extension:
              </p>
              <div className="mime-tags" role="list">
                <span className="mime-tag mime-tag--accent" role="listitem">
                  {mimeTypeFound}
                </span>
              </div>
            </div>
          ) : null}
        </ToolPanel>
      </ToolWorkspace>

      <ToolPanel labelledBy="mime-table-heading" className="mime-tool__panel mime-tool__table-panel">
        <ToolSectionHeading
          title="MIME types reference"
          titleId="mime-table-heading"
          description={
            <ToolHint>
              Full MIME type ↔ extension map from mime-db ({MIME_INFOS.length} types).
            </ToolHint>
          }
        />

        <ToolInput
          id="mime-table-filter"
          label="Filter table"
          full
          value={tableFilter}
          placeholder="Filter by MIME type or extension…"
          onChange={(event) => setTableFilter(event.target.value)}
          autoComplete="off"
          spellCheck={false}
        />

        <div className="mime-table-wrap">
          <table className="mime-table">
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
                    <div className="mime-tags">
                      {extensions.map((extension) => (
                        <span key={extension} className="mime-tag">
                          .{extension}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInfos.length === 0 ? (
                <tr>
                  <td colSpan={2} className="mime-table__empty">
                    No MIME types match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </ToolPanel>
    </ToolIsland>
  );
}
