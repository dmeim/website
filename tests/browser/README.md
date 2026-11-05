# Browser tests

These tests drive the 86 tools in Chromium against the production build. They catch bugs that unit tests can't, such as the minifier deleting a validator or a page only breaking at build time. See [the contributor brief](../../docs/tools/AGENT_BRIEF.md) for how they fit into tool work.

## Setup

```bash
npm install
```

```bash
npx playwright install chromium
```

Some scenarios compare a tool's output against an independent source, so they also need `openssl`, `python3`, and `htpasswd` on your path, plus network access because the ASCII art tool loads its fonts from a CDN.

## Running

Build the site and run everything, which takes about 2 minutes:

```bash
npm run test:browser
```

Run only some scenarios against the existing build, without rebuilding:

```bash
npx playwright test -g "url-encoder"
```

Rebuild after changing site code, because the tests only see `dist/client`. Failures save a screenshot in `test-results/`.

The tests serve the build on port 4399 and stop with an error if that port is taken.

## Writing a scenario

Each file in `scenarios/` exports a list, and `tools.spec.mjs` turns every entry into a test. Register new files in `SUITES` in that spec.

```js
export default [
  {
    slug: "url-encoder",
    name: "broken percent sequence shows a message",
    async run(t) {
      await t.open();
      await t.fill("Your encoded string", "100%");
      await t.has("percent sequence");
    },
  },
];
```

- **Options:** a scenario can also set `viewport`, `colorScheme`, or `allowConsoleErrors`. Any uncaught page error or console error fails the scenario unless `allowConsoleErrors` is set.
- **Helpers:** `t` provides `open`, `field`, `fill`, `value`, `text`, `has`, `hasNot`, `click`, `clipboard`, `download`, and `noOverflow`, plus the raw `page` and `assert`.
- **Expected values:** take them from a published spec or an independent source such as `node:crypto`, `openssl`, or `python3`, never from the tool's own output.

## Suites

- **`shell`:** the `/tools` landing page, search, navigation, and 404s.
- **`crypto`, `converter`, `web`, `dev`, `netmath`, `textmedia`:** every tool in each group, checked against it-tools behavior.
- **`case-converter`:** digits and non-Latin text survive in the page.
- **`crypto-web-independent`:** a second pass over the crypto and web tools, written without reading their code.

## Fixtures

`fixtures/` holds the PDFs for the signature checker and the public certificate that signed them. `node tests/browser/fixtures/make-fixtures.mjs` rebuilds them with `openssl`. It deletes the throwaway signing key afterward, so no private key is ever stored.
