import type { GroupPermissions, Permissions, Scope } from "./chmodCalculator.types";

export type { Group, GroupPermissions, Permissions, Scope } from "./chmodCalculator.types";

/** Fixed rwx order — matches it-tools object-key iteration for symbolic output. */
const SCOPES: Scope[] = ["read", "write", "execute"];

const OCTAL_VALUE: Record<Scope, number> = { read: 4, write: 2, execute: 1 };
const SYMBOLIC_VALUE: Record<Scope, string> = { read: "r", write: "w", execute: "x" };

function groupOctal(permission: GroupPermissions): number {
  return SCOPES.reduce(
    (acc, key) => acc + (permission[key] ? OCTAL_VALUE[key] : 0),
    0,
  );
}

function groupSymbolic(permission: GroupPermissions): string {
  return SCOPES.reduce(
    (acc, key) => acc + (permission[key] ? SYMBOLIC_VALUE[key] : "-"),
    "",
  );
}

/** Three-digit octal mode from owner/group/public permission flags. */
export function computeChmodOctalRepresentation({
  permissions,
}: {
  permissions: Permissions;
}): string {
  return [
    groupOctal(permissions.owner),
    groupOctal(permissions.group),
    groupOctal(permissions.public),
  ].join("");
}

/** Nine-character symbolic mode (e.g. `rwxr-xr--`) from permission flags. */
export function computeChmodSymbolicRepresentation({
  permissions,
}: {
  permissions: Permissions;
}): string {
  return [
    groupSymbolic(permissions.owner),
    groupSymbolic(permissions.group),
    groupSymbolic(permissions.public),
  ].join("");
}

/** Example `chmod` command using the octal mode and a path placeholder. */
export function chmodCommand(octal: string, path = "path"): string {
  return `chmod ${octal} ${path}`;
}

/** All-false permissions — matches it-tools initial UI state. */
export function createEmptyPermissions(): Permissions {
  return {
    owner: { read: false, write: false, execute: false },
    group: { read: false, write: false, execute: false },
    public: { read: false, write: false, execute: false },
  };
}
