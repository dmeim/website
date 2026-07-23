/**
 * In-isolate registry of active generation AbortControllers.
 * Stop requests abort the matching chat's stream; onAbort persists partials.
 * Note: only works within the same Worker isolate that started the stream.
 */

const controllers = new Map<string, AbortController>();

export function registerGenerationAbort(chatId: string): AbortSignal {
  const existing = controllers.get(chatId);
  if (existing) {
    existing.abort();
    controllers.delete(chatId);
  }
  const controller = new AbortController();
  controllers.set(chatId, controller);
  return controller.signal;
}

export function clearGenerationAbort(chatId: string): void {
  controllers.delete(chatId);
}

/** Returns true if an in-flight controller was aborted. */
export function abortGeneration(chatId: string): boolean {
  const controller = controllers.get(chatId);
  if (!controller) return false;
  controller.abort();
  controllers.delete(chatId);
  return true;
}

export function hasActiveGeneration(chatId: string): boolean {
  return controllers.has(chatId);
}
