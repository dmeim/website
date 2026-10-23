import { Code, Divider, Eyebrow, Kbd, Link, Prose, VisuallyHidden } from "@/ui/react/groups/text";
import { CodeBlock } from "@/ui/react/groups/text";
import { ThemePair } from "./ThemePair";

const stack = { display: "grid", gap: "var(--ui-space-sm)" } as const;
const row = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: "var(--ui-space-sm)" } as const;

const proseHtml =
  "<h2>Heading two</h2><p>Body with a <a href=\"#text\">link</a> and <code>code</code>.</p><h3>Heading three</h3><ul><li>One</li><li>Two</li></ul><blockquote>Quote</blockquote><pre><code>const x = 42;</code></pre><table><thead><tr><th>Key</th><th>Value</th></tr></thead><tbody><tr><td>a</td><td>1</td></tr></tbody></table><hr /><p>After the rule.</p>";

export function TextShowcase() {
  return (
    <ThemePair>
      <div style={stack}>
        <h4 className="ui-showcase-sub">Link</h4>
        <p style={row}>
          <Link href="#text">Default</Link>
          <Link href="#text" tone="quiet">Quiet</Link>
          <Link href="#text" tone="accent">Accent</Link>
          <Link href="#text" arrow="right">Arrow right</Link>
          <Link href="#text" tone="quiet" arrow="up-right">Arrow up-right</Link>
          <Link href="https://github.com" external>External</Link>
        </p>
        <h4 className="ui-showcase-sub">Eyebrow</h4>
        <Eyebrow>Selected work</Eyebrow>
        <Eyebrow as="span">As span</Eyebrow>
        <h4 className="ui-showcase-sub">Code and Kbd</h4>
        <p>
          Run <Code>npm run dev</Code> then press <Kbd>Esc</Kbd> or <Kbd keys={["Ctrl", "Shift", "K"]} />.
        </p>
        <h4 className="ui-showcase-sub">VisuallyHidden</h4>
        <p>Hidden text follows:<VisuallyHidden> screen-reader only</VisuallyHidden> (inspect to see).</p>
        <h4 className="ui-showcase-sub">Divider</h4>
        <Divider />
        <Divider label="or" />
        <div style={{ ...row, height: "2rem" }}>Left<Divider orientation="vertical" />Right</div>
        <h4 className="ui-showcase-sub">Prose (html, sm)</h4>
        <Prose html={proseHtml} />
        <Prose size="sm"><p>Small prose paragraph for dense contexts.</p></Prose>
        <h4 className="ui-showcase-sub">CodeBlock</h4>
        <CodeBlock label="install.sh" language="bash" code={"npm install\nnpm run dev"} />
        <CodeBlock code={"const answer = 42; // no label: floating copy"} />
        <CodeBlock wrap copy={false} code={"A wrapped line without copy button that keeps going and going until it has to wrap onto the next line in narrow columns."} />
        <CodeBlock label="long.txt" maxHeight="6rem" code={Array.from({ length: 12 }, (_, i) => `line ${i + 1}`).join("\n")} />
      </div>
    </ThemePair>
  );
}
