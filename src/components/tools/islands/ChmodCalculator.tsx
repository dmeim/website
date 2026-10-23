import { useCallback, useMemo, useState } from "react";

import {
  Checkbox,
  Code,
  KeyValue,
  OutputField,
  Panel,
  Table,
  ToolFrame,
} from "@/ui/react";
import {
  chmodCommand,
  computeChmodOctalRepresentation,
  computeChmodSymbolicRepresentation,
  createEmptyPermissions,
  type Group,
  type Permissions,
  type Scope,
} from "@/lib/tools/chmod-calculator";

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

  return (
    <ToolFrame>
      <Panel
        title="Permissions"
        titleId="chmod-heading"
        description={
          <>
            Toggle owner, group, and public bits to build an octal mode and{" "}
            <Code>chmod</Code> command.
          </>
        }
      >
        <Table caption="Permission matrix" captionHidden density="compact">
          <thead>
            <tr>
              <th scope="col">
                <span className="ui-visually-hidden">Permission</span>
              </th>
              {GROUPS.map(({ group, title }) => (
                <th key={group} scope="col">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SCOPES.map(({ scope, title }) => (
              <tr key={scope}>
                <th scope="row">{title}</th>
                {GROUPS.map(({ group }) => (
                  <td key={group}>
                    <Checkbox
                      id={`chmod-${group}-${scope}`}
                      label={`${title} for ${group}`}
                      labelHidden
                      checked={permissions[group][scope]}
                      onChange={(event) =>
                        setPermission(group, scope, event.target.checked)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>

        <KeyValue
          aria-live="polite"
          items={[
            {
              label: "Octal",
              value: <span data-testid="octal">{octal}</span>,
              mono: true,
              copy: octal,
            },
            {
              label: "Symbolic",
              value: <span data-testid="symbolic">{symbolic}</span>,
              mono: true,
              copy: symbolic,
            },
          ]}
        />

        <OutputField id="chmod-command" label="Command" value={command} />
      </Panel>
    </ToolFrame>
  );
}
