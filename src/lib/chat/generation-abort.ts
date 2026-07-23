/**
 * In-isolate registry of active generation AbortControllers.
 * Stop requests abort the matching chat's stream; onAbort persists partials.
 * Note: only works within the same Worker isolate that started the stream.
 *
 * Each registration gets a generation token so a prior stream's cleanup cannot
 * clear the AbortController registered for a newer generation of the same chat.
 */

type GenerationEntry = {
  controller: AbortController;
  generation: number;
};

const controllers = new Map<string, GenerationEntry>();
let nextGeneration = 1;

export type GenerationAbortHandle = {
  signal: AbortSignal;
  generation: number;
};

export function registerGenerationAbort(chatId: string): GenerationAbortHandle {
  const existing = controllers.get(chatId);
  if (existing) {
    existing.controller.abort();
    controllers.delete(chatId);
  }
  const generation = nextGeneration++;
  const controller = new AbortController();
  controllers.set(chatId, { controller, generation });
  return { signal: controller.signal, generation };
}

/**
 * Clear the registered controller for `chatId`.
 * When `generation` is provided, only clears if it still matches (avoids abort
 * races where an older stream's finally wipes a newer registration).
 */
export function clearGenerationAbort(
  chatId: string,
  generation?: number,
): void {
  const entry = controllers.get(chatId);
  if (!entry) return;
  if (generation !== undefined && entry.generation !== generation) return;
  controllers.delete(chatId);
}

/** Returns true if an in-flight controller was aborted. */
export function abortGeneration(chatId: string): boolean {
  const entry = controllers.get(chatId);
  if (!entry) return false;
  entry.controller.abort();
  controllers.delete(chatId);
  return true;
}

export function hasActiveGeneration(chatId: string): boolean {
  return controllers.has(chatId);
}

/** Test / debug: active generation token for a chat, if any. */
export function peekGenerationAbort(chatId: string): number | undefined {
  return controllers.get(chatId)?.generation;
}
