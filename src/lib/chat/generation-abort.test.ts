import { afterEach, describe, expect, it } from "vitest";
import {
  abortGeneration,
  clearGenerationAbort,
  hasActiveGeneration,
  peekGenerationAbort,
  registerGenerationAbort,
} from "./generation-abort";

afterEach(() => {
  for (const id of ["chat-1", "chat-2"]) {
    abortGeneration(id);
  }
});

describe("generation-abort tokens", () => {
  it("register returns a signal and unique generation", () => {
    const first = registerGenerationAbort("chat-1");
    expect(first.signal.aborted).toBe(false);
    expect(typeof first.generation).toBe("number");
    expect(hasActiveGeneration("chat-1")).toBe(true);
    expect(peekGenerationAbort("chat-1")).toBe(first.generation);
  });

  it("register aborts the previous controller for the same chat", () => {
    const first = registerGenerationAbort("chat-1");
    const second = registerGenerationAbort("chat-1");
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
    expect(second.generation).not.toBe(first.generation);
    expect(peekGenerationAbort("chat-1")).toBe(second.generation);
  });

  it("clearGenerationAbort only clears matching generation", () => {
    const first = registerGenerationAbort("chat-1");
    const second = registerGenerationAbort("chat-1");
    clearGenerationAbort("chat-1", first.generation);
    expect(hasActiveGeneration("chat-1")).toBe(true);
    expect(peekGenerationAbort("chat-1")).toBe(second.generation);

    clearGenerationAbort("chat-1", second.generation);
    expect(hasActiveGeneration("chat-1")).toBe(false);
  });

  it("abortGeneration removes the latest entry", () => {
    registerGenerationAbort("chat-1");
    expect(abortGeneration("chat-1")).toBe(true);
    expect(hasActiveGeneration("chat-1")).toBe(false);
    expect(abortGeneration("chat-1")).toBe(false);
  });
});
