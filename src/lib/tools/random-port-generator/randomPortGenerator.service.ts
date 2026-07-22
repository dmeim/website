/** Inclusive lower bound — matches it-tools `randIntFromInterval(1024, 65535)`. */
export const PORT_MIN = 1024;

/**
 * Upper argument to it-tools `randIntFromInterval` (half-open).
 * Generated ports are in `[PORT_MIN, PORT_MAX)` i.e. 1024–65534.
 */
export const PORT_MAX = 65535;

/** Uniform integer in `[0, maxExclusive)` via Web Crypto when available. */
function randomIntBelow(maxExclusive: number): number {
  if (maxExclusive <= 1) {
    return 0;
  }

  const cryptoApi = globalThis.crypto;

  if (cryptoApi?.getRandomValues) {
    const limit = 0x100000000;
    const rejectAbove = limit - (limit % maxExclusive);
    const buffer = new Uint32Array(1);

    for (;;) {
      cryptoApi.getRandomValues(buffer);
      const value = buffer[0]!;
      if (value < rejectAbove) {
        return value % maxExclusive;
      }
    }
  }

  return Math.floor(Math.random() * maxExclusive);
}

/**
 * Random port outside the well-known range (0–1023).
 * Parity with it-tools: `Math.floor(random() * (65535 - 1024) + 1024)` → `[1024, 65535)`.
 */
export function generatePort(): number {
  return PORT_MIN + randomIntBelow(PORT_MAX - PORT_MIN);
}

/** True when `value` is an integer in the generator's output range. */
export function isValidGeneratedPort(value: unknown): boolean {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return false;
  }

  return value >= PORT_MIN && value < PORT_MAX;
}
