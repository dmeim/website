import { runRegex, type RegexRunRequest } from "./regexTester.service";

// The timeout starts here, so a slow worker download never reads as a slow regex.
postMessage({ type: "ready" });

addEventListener("message", (event: MessageEvent<RegexRunRequest>) => {
  postMessage({ type: "result", result: runRegex(event.data) });
});
