import { useCallback, useMemo, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolHint,
  ToolInput,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
} from "@/components/tools/ui";
import { copyTextToClipboard } from "@/lib/tools/clipboard";
import {
  chmodCommand,
  computeChmodOctalRepresentation,
  computeChmodSymbolicRepresentation,
  createEmptyPermissions,
  type Group,
  type Permissions,
  type Scope,
} from "@/lib/tools/chmod-calculator";

import "./ChmodCalculator.css";

const SCOPES: { scope: Scope; title: string }[] = [
  { scope: "read", title: "Read (4)" },
  { scope: "write", title: "Write (2)" },
  { scope: "execute", title: "Execute (1)" },
];

const GROUPS: { group: Group; title: string }[] = [
  { group: "owner", title: "Owner (u)" },
  { group: "group", title: "Group (g)" },
  { group: "public", title: "Public (o)" },
];

export default function ChmodCalculator() {
  const [permissions, setPermissions] = useState<Permissions>(createEmptyPermissions);
  const [actionStatus, setActionStatus] = useState("");

  const octal = useMemo(
    () => computeChmodOctalRepresentation({ permissions }),
    [permissions],
  );
  const symbolic = useMemo(
    () => computeChmodSymbolicRepresentation({ permissions }),
    [permissions],
  );
  const command = useMemo(() => chmodCommand(octal), [octal]);

  const setPermission = useCallback((group: Group, scope: Scope, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [scope]: checked,
      },
    }));
  }, []);

  const copyCommand = useCallback(async () => {
    try {
      await copyTextToClipboard(command);
      setActionStatus("Command copied to the clipboard.");
    } catch {
      setActionStatus("Copy failed. Select the command and copy it manually.");
    }
  }, [command]);

  return (
    <ToolIsland className="chmod-tool">
      <ToolPanel labelledBy="chmod-heading" className="chmod-tool__panel">
        <ToolSectionHeading
          title="Permissions"
          titleId="chmod-heading"
          description={
            <ToolHint>
              Toggle owner, group, and public bits to build an octal mode and{" "}
              <code>chmod</code> command.
            </ToolHint>
          }
        />

        <div className="chmod-table-wrap" role="region" aria-label="Permission matrix">
          <table className="chmod-table">
            <thead>
              <tr>
                <th scope="col" className="chmod-table__corner" />
                {GROUPS.map(({ group, title }) => (
                  <th key={group} scope="col" className="chmod-table__col">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCOPES.map(({ scope, title }) => (
                <tr key={scope}>
                  <th scope="row" className="chmod-table__row">
                    {title}
                  </th>
                  {GROUPS.map(({ group }) => (
                    <td key={group} className="chmod-table__cell">
                      <ToolCheck
                        id={`chmod-${group}-${scope}`}
                        label={<span className="visually-hidden">{`${title} for ${group}`}</span>}
                        checked={permissions[group][scope]}
                        onChange={(event) =>
                          setPermission(group, scope, event.target.checked)
                        }
                        className="chmod-check"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="chmod-result" aria-live="polite" data-testid="octal">
          {octal}
        </p>
        <p className="chmod-result chmod-result--symbolic" aria-live="polite" data-testid="symbolic">
          {symbolic}
        </p>

        <ToolInput
          id="chmod-command"
          label="Command"
          full
          readOnly
          value={command}
          className="chmod-command tool-code"
          aria-live="polite"
        />

        <ToolActionRow>
          <ToolButton type="button" onClick={() => void copyCommand()}>
            Copy command
          </ToolButton>
        </ToolActionRow>

        {actionStatus ? <ToolStatus tone="success">{actionStatus}</ToolStatus> : null}
      </ToolPanel>
    </ToolIsland>
  );
}
