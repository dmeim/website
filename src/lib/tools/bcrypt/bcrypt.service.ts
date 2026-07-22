import bcrypt from "bcryptjs";

export const BCRYPT_ROUNDS_MIN = 0;
export const BCRYPT_ROUNDS_MAX = 100;
export const BCRYPT_ROUNDS_DEFAULT = 10;

/** bcrypt hashes are 60 chars: `$2[aby]$` + 2-digit cost + `$` + 53 salt/hash chars. */
const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function clampSaltRounds(value: unknown, fallback = BCRYPT_ROUNDS_DEFAULT): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(BCRYPT_ROUNDS_MAX, Math.max(BCRYPT_ROUNDS_MIN, Math.trunc(parsed)));
}

/** True when `value` looks like a standard bcrypt modular crypt hash. */
export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value.trim());
}

/**
 * Hash `password` with bcrypt using the given salt-round cost.
 * Rounds are clamped to 0–100 (it-tools range).
 */
export async function hashPassword(
  password: string,
  rounds: number = BCRYPT_ROUNDS_DEFAULT,
): Promise<string> {
  return bcrypt.hash(password, clampSaltRounds(rounds));
}

/**
 * Compare `password` to a bcrypt `hash`.
 * Empty or malformed hashes return `false` (no throw).
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const trimmed = hash.trim();

  if (!trimmed || !isBcryptHash(trimmed)) {
    return false;
  }

  try {
    return await bcrypt.compare(password, trimmed);
  } catch {
    return false;
  }
}

/** True when bcrypt would truncate the password to its 72-byte limit. */
export function passwordTruncates(password: string): boolean {
  return bcrypt.truncates(password);
}
