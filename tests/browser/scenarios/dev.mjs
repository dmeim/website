const mobile = { width: 375, height: 800 };
const settle = (t) => t.page.waitForTimeout(1300);
const overflow = (slug, extra) => ({ slug, name: "no overflow at 375", viewport: mobile, async run(t) { await t.open(); if (extra) await extra(t); await settle(t); await t.noOverflow(); } });
const fieldOf = (t, label) => t.field(label).locator("xpath=ancestor::*[contains(concat(' ',@class,' '),' ui-field ')][1]");
const copyIn = async (t, label) => { await fieldOf(t, label).getByRole("button", { name: /copy/i }).first().click(); await t.page.waitForTimeout(80); return t.clipboard(); };
const kv = async (t) => t.main().locator(".ui-key-value__item").evaluateAll((items) => items.map((item) => [item.querySelector("dt").innerText.trim(), item.querySelector(".ui-key-value__text").innerText.trim()]));
const kvMap = async (t) => Object.fromEntries(await kv(t));
const stored = (t, key) => t.page.evaluate((k) => localStorage.getItem("tools:" + k), key);
const fillId = async (t, id, value) => { await t.page.locator(id).fill(value); await t.page.waitForTimeout(80); };
const CATASTROPHIC = "a".repeat(40) + "!";

export default [
  // git-memo
  { slug: "git-memo", name: "commands, search, copy, and empty search", async run(t) {
    await t.open();
    await t.has("11 results");
    await t.has("git reset HEAD~1 --hard");
    await t.has("Undo the N most recent commits and keep changes");
    await t.hasNot("`");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), `git config --global user.name "[name]"\ngit config --global user.email "[email]"`);
    await t.fill("Search Git commands", "amend");
    await t.has("2 results");
    await t.hasNot("git init");
    await t.fill("Search Git commands", "zzzz");
    await t.has("No Git commands match this search");
    await t.fill("Search Git commands", "");
    await t.has("git init");
  } },
  overflow("git-memo"),
  // random-port-generator
  { slug: "random-port-generator", name: "port in range, refresh, copy", async run(t) {
    await t.open();
    const read = async () => Number((await t.main().getByTestId("port").innerText()).match(/\d+/)[0]);
    const first = await read();
    t.assert.ok(first >= 1024 && first <= 65535, String(first));
    const seen = new Set([first]);
    for (let i = 0; i < 5; i++) { await t.click("Refresh"); const port = await read(); t.assert.ok(port >= 1024 && port <= 65535, String(port)); seen.add(port); }
    t.assert.ok(seen.size > 1, "refresh should change the port");
    const shown = await read();
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), String(shown));
  } },
  overflow("random-port-generator"),
  // crontab-generator
  { slug: "crontab-generator", name: "descriptions and options", async run(t) {
    await t.open();
    const desc = () => t.main().getByTestId("cron-description").innerText();
    t.assert.equal(await desc(), "At 40 minutes past the hour, every hour, every day");
    await t.page.getByLabel("Verbose").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.equal(await desc(), "At 40 minutes past the hour");
    await t.page.getByLabel("Verbose").check();
    await fillId(t, "#cg-expression", "0 14 * * 1");
    t.assert.ok((await desc()).startsWith("At 14:00"));
    t.assert.ok((await desc()).includes("Monday"));
    await t.page.getByLabel("Use 24 hour time format").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.ok((await desc()).startsWith("At 02:00 PM"));
    await t.page.getByLabel("Days start at 0").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.ok((await desc()).includes("Sunday"));
    await fillId(t, "#cg-expression", "0 14 * * 7");
    t.assert.ok((await desc()).includes("Saturday"));
    await fillId(t, "#cg-expression", "0 14 * * 0");
    await t.has("DOW part must be >= 1 and <= 7");
    t.assert.equal((await desc()).trim(), "");
    await t.page.getByLabel("Days start at 0").check();
    await t.page.waitForTimeout(80);
    t.assert.ok((await desc()).includes("Sunday"));
    await t.hasNot("This cron is invalid");
    await fillId(t, "#cg-expression", "*/5 * * * * *");
    t.assert.ok((await desc()).startsWith("Every 5 seconds"));
  } },
  { slug: "crontab-generator", name: "invalid, empty, shortcuts, and copy", async run(t) {
    await t.open();
    const desc = () => t.main().getByTestId("cron-description").innerText();
    for (const [bad, reason] of [["60 * * * *", "minutes part must be >= 0 and <= 59"], ["* 24 * * *", "hours part"], ["* * 32 * *", "DOM part"], ["* * * 13 *", "month part"], ["* * * * 8", "DOW part"], ["nope", "at least 5 parts"], ["*/0 * * * *", "Use 5 or 6 fields"]]) {
      await fillId(t, "#cg-expression", bad);
      const text = (await t.text()).toLowerCase();
      t.assert.ok(text.includes("this cron is invalid"), bad);
      t.assert.ok(text.includes(reason.toLowerCase()), `${bad}: ${reason}`);
      t.assert.equal((await desc()).trim(), "", bad);
    }
    await fillId(t, "#cg-expression", "");
    await t.hasNot("This cron is invalid");
    t.assert.equal((await desc()).trim(), "");
    await fillId(t, "#cg-expression", "@daily");
    t.assert.equal(await desc(), "At 00:00, every day");
    await fillId(t, "#cg-expression", "@reboot");
    t.assert.equal(await desc(), "Run at startup");
    await fillId(t, "#cg-expression", "*/10 * * * *");
    t.assert.equal(await desc(), "Every 10 minutes, every hour, every day");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "*/10 * * * *");
    await t.has("@annually");
  } },
  overflow("crontab-generator", (t) => fillId(t, "#cg-expression", "60 * * * *")),
  // json-prettify
  { slug: "json-prettify", name: "vectors, options, copy", async run(t) {
    await t.open();
    const out = () => t.value("Prettified version of your JSON");
    t.assert.equal(await out(), '{\n   "foo": "bar",\n   "hello": "world"\n}');
    t.assert.equal(await copyIn(t, "Prettified version of your JSON"), '{\n   "foo": "bar",\n   "hello": "world"\n}');
    await t.page.getByLabel("Sort keys").uncheck();
    await t.page.waitForTimeout(80);
    t.assert.equal(await out(), '{\n   "hello": "world",\n   "foo": "bar"\n}');
    await t.fill("Indent size", "1");
    t.assert.equal(await out(), '{\n "hello": "world",\n "foo": "bar"\n}');
    await t.fill("Indent size", "0");
    t.assert.equal(await out(), '{"hello":"world","foo":"bar"}');
    await t.fill("Your raw JSON", "{b: 'é😀', a: [1,],}");
    t.assert.equal(await out(), '{"b":"é😀","a":[1]}');
  } },
  { slug: "json-prettify", name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("Your raw JSON", '{"a": }');
    await t.has("Provided JSON is not valid: invalid character '}' at 1:7.");
    t.assert.equal(await t.value("Prettified version of your JSON"), "");
    await t.fill("Your raw JSON", "   ");
    await t.hasNot("not valid");
    t.assert.equal(await t.value("Prettified version of your JSON"), "");
    await t.fill("Your raw JSON", "");
    await t.hasNot("not valid");
    await t.fill("Your raw JSON", "0");
    t.assert.equal(await t.value("Prettified version of your JSON"), "0");
  } },
  { slug: "json-prettify", name: "indent field can be cleared and is clamped", async run(t) {
    await t.open();
    await t.fill("Indent size", "");
    t.assert.equal(await t.value("Indent size"), "");
    t.assert.equal(await t.value("Prettified version of your JSON"), '{\n   "foo": "bar",\n   "hello": "world"\n}');
    await t.fill("Indent size", "99");
    t.assert.equal((await t.value("Prettified version of your JSON")).split("\n")[1], `${" ".repeat(10)}"foo": "bar",`);
    await t.field("Indent size").blur();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Indent size"), "10");
  } },
  { slug: "json-prettify", name: "persists settings but not the JSON", async run(t) {
    await t.open();
    await t.page.getByLabel("Sort keys").uncheck();
    await t.fill("Indent size", "5");
    await t.fill("Your raw JSON", '{"secret": 1}');
    await t.page.waitForTimeout(100);
    t.assert.equal(await stored(t, "json-prettify:indent-size"), "5");
    t.assert.ok(!JSON.stringify(await t.page.evaluate(() => ({ ...localStorage }))).includes("secret"));
    await t.open();
    t.assert.equal(await t.value("Indent size"), "5");
    t.assert.equal(await t.page.getByLabel("Sort keys").isChecked(), false);
    t.assert.equal(await t.value("Your raw JSON"), '{"hello": "world", "foo": "bar"}');
    t.assert.equal(await t.value("Prettified version of your JSON"), '{\n     "hello": "world",\n     "foo": "bar"\n}');
  } },
  overflow("json-prettify"),
  // json-minify
  { slug: "json-minify", name: "vectors, invalid, empty, copy", async run(t) {
    await t.open();
    const out = () => t.value("Minified version of your JSON");
    t.assert.equal(await out(), '{"hello":["world"]}');
    t.assert.equal(await copyIn(t, "Minified version of your JSON"), '{"hello":["world"]}');
    await t.fill("Your raw JSON", "{\n  a: 1,\n  'b': [2, 3,],\n  // note\n  c: 'é😀',\n}");
    t.assert.equal(await out(), '{"a":1,"b":[2,3],"c":"é😀"}');
    await t.fill("Your raw JSON", "[1, 2");
    await t.has("Provided JSON is not valid: invalid end of input at 1:6.");
    t.assert.equal(await out(), "");
    await t.fill("Your raw JSON", "");
    await t.hasNot("not valid");
    t.assert.equal(await out(), "");
    await t.fill("Your raw JSON", " \n ");
    await t.hasNot("not valid");
  } },
  overflow("json-minify"),
  // json-to-csv
  { slug: "json-to-csv", name: "it-tools vector and copy", async run(t) {
    await t.open();
    const out = () => t.value("CSV version of your JSON");
    t.assert.equal(await out(), "");
    await t.fill("Your raw JSON", `
[
  {'Age': 18.0, 'Salary': 20000.0, 'Gender': 'Male', 'Country': 'Germany', 'Purchased': 'N'},
  {'Age': 19.0, 'Salary': 22000.0, 'Gender': 'Female', 'Country': 'France', 'Purchased': 'N'},
]
    `);
    const expected = "Age,Salary,Gender,Country,Purchased\n18,20000,Male,Germany,N\n19,22000,Female,France,N";
    t.assert.equal(await out(), expected);
    t.assert.equal(await copyIn(t, "CSV version of your JSON"), expected);
  } },
  { slug: "json-to-csv", name: "nested, quoting, missing keys parse back with python csv", async run(t) {
    await t.open();
    await t.fill("Your raw JSON", JSON.stringify([{ a: 1, b: 'say "hi", ok', n: { x: [1, 2] } }, { a: null, c: "l1\nl2", "h,1": true }]));
    const csv = await t.value("CSV version of your JSON");
    t.assert.equal(csv, 'a,b,n,c,"h,1"\n1,"say ""hi"", ok","{""x"":[1,2]}",,\nnull,,,"l1\nl2",true');
    const { execFileSync } = await import("node:child_process");
    const parsed = JSON.parse(execFileSync("python3", ["-I", "-c", "import csv,io,json,sys;print(json.dumps(list(csv.reader(io.StringIO(sys.stdin.read(),newline='')))))"], { input: csv }).toString());
    t.assert.deepEqual(parsed, [["a", "b", "n", "c", "h,1"], ["1", 'say "hi", ok', '{"x":[1,2]}', "", ""], ["null", "", "", "l1\nl2", "true"]]);
  } },
  { slug: "json-to-csv", name: "invalid and wrong shape explain themselves", async run(t) {
    await t.open();
    await t.fill("Your raw JSON", "{nope");
    await t.has("Provided JSON is not valid");
    await t.fill("Your raw JSON", '{"a": 1}');
    await t.has("must be an array of objects");
    t.assert.equal(await t.value("CSV version of your JSON"), "");
    await t.fill("Your raw JSON", "[1, 2]");
    await t.has("must be an array of objects");
    await t.fill("Your raw JSON", "[]");
    await t.hasNot("must be an array");
    t.assert.equal(await t.value("CSV version of your JSON"), "");
    await t.fill("Your raw JSON", "");
    await t.hasNot("must be an array");
  } },
  overflow("json-to-csv"),
  // sql-prettify
  { slug: "sql-prettify", name: "vectors and every option", async run(t) {
    await t.open();
    const out = () => t.value("Prettify version of your query");
    t.assert.equal(await out(), "SELECT\n  field1,\n  field2,\n  field3\nFROM\n  my_table\nWHERE\n  my_condition;");
    t.assert.equal(await copyIn(t, "Prettify version of your query"), await out());
    await t.fill("Your SQL query", "Select a, b From t;");
    await t.field("Keyword case").selectOption("lower");
    t.assert.equal(await out(), "select\n  a,\n  b\nfrom\n  t;");
    await t.field("Keyword case").selectOption("preserve");
    t.assert.equal(await out(), "Select\n  a,\n  b\nFrom\n  t;");
    await t.field("Keyword case").selectOption("upper");
    await t.field("Indent style").selectOption("tabularLeft");
    t.assert.equal(await out(), "SELECT    a,\n          b\nFROM      t;");
    await t.field("Indent style").selectOption("tabularRight");
    t.assert.ok((await out()).startsWith("   SELECT"));
    t.assert.ok((await out()).endsWith("     FROM t;"));
    await t.field("Indent style").selectOption("standard");
    await t.fill("Your SQL query", "select a::int from t;");
    await t.has("Unexpected");
    await t.has("pick the dialect");
    t.assert.equal(await out(), "");
    await t.field("Dialect").selectOption("postgresql");
    await t.hasNot("Unexpected");
    t.assert.equal(await out(), "SELECT\n  a::INT\nFROM\n  t;");
  } },
  { slug: "sql-prettify", name: "all dialects format, invalid and empty are clean", async run(t) {
    await t.open();
    for (const dialect of ["bigquery", "db2", "hive", "mariadb", "mysql", "n1ql", "plsql", "postgresql", "redshift", "spark", "sql", "sqlite", "tsql"]) {
      await t.field("Dialect").selectOption(dialect);
      t.assert.equal(await t.value("Prettify version of your query"), "SELECT\n  field1,\n  field2,\n  field3\nFROM\n  my_table\nWHERE\n  my_condition;", dialect);
    }
    await t.fill("Your SQL query", "not sql !!!");
    await t.has('Unexpected "!!!" at line 1 column 9');
    t.assert.equal(await t.value("Prettify version of your query"), "");
    await t.fill("Your SQL query", "");
    await t.hasNot("Unexpected");
    t.assert.equal(await t.value("Prettify version of your query"), "");
  } },
  overflow("sql-prettify"),
  // chmod-calculator
  { slug: "chmod-calculator", name: "octal and symbolic match python stat.filemode", async run(t) {
    await t.open();
    const octal = () => t.main().getByTestId("octal").innerText();
    const symbolic = () => t.main().getByTestId("symbolic").innerText();
    t.assert.equal(await octal(), "000");
    t.assert.equal(await symbolic(), "---------");
    const bit = (scope, group) => t.page.getByLabel(`${scope} for ${group}`);
    const R = "Read (4)", W = "Write (2)", X = "Execute (1)";
    const setMode = async (mode) => {
      const groups = ["owner", "group", "public"];
      for (const [g, group] of groups.entries()) {
        const digit = Number(mode[g]);
        for (const [scope, value] of [[R, 4], [W, 2], [X, 1]]) await bit(scope, group).setChecked((digit & value) !== 0);
      }
      await t.page.waitForTimeout(60);
    };
    for (const [mode, sym] of [["755", "rwxr-xr-x"], ["644", "rw-r--r--"], ["421", "r---w---x"], ["640", "rw-r-----"], ["777", "rwxrwxrwx"], ["235", "-w--wxr-x"], ["000", "---------"]]) {
      await setMode(mode);
      t.assert.equal(await octal(), mode);
      t.assert.equal(await symbolic(), sym);
      t.assert.equal(await t.value("Command"), `chmod ${mode} path`);
    }
    await setMode("750");
    await t.main().getByRole("button", { name: "Copy Octal" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "750");
    await t.main().getByRole("button", { name: "Copy Symbolic" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "rwxr-x---");
    t.assert.equal(await copyIn(t, "Command"), "chmod 750 path");
  } },
  overflow("chmod-calculator"),
  // docker-run-to-docker-compose-converter
  { slug: "docker-run-to-docker-compose-converter", name: "default sample, copy, and download", async run(t) {
    await t.open();
    const yaml = await t.value("docker-compose.yml");
    for (const line of ["version: '3.9'", "services:", "nginx:", "image: nginx", "restart: always", "- '80:80'", "- '/var/run/docker.sock:/tmp/docker.sock:ro'", "max-size: 1g"]) t.assert.ok(yaml.includes(line), line);
    await t.click("Copy YAML");
    t.assert.equal(await t.clipboard(), yaml);
    const file = await t.download("Download docker-compose.yml");
    t.assert.equal(file.name, "docker-compose.yml");
    t.assert.equal(file.text, yaml);
  } },
  { slug: "docker-run-to-docker-compose-converter", name: "warnings for unsupported flags", async run(t) {
    await t.open();
    const input = "Your docker run command";
    await t.fill(input, "docker run --rm -d --gpus all --bogus-flag nginx");
    await t.has("These options are not translatable to docker-compose");
    await t.has('The option "--rm" could not be translated to docker-compose.yml.');
    await t.has('The option "--detach/-d" could not be translated to docker-compose.yml.');
    await t.has("not yet implemented");
    await t.has('The option "--gpus" is not yet implemented.');
    await t.has("The following errors occurred");
    await t.has("Unknown option: bogus-flag");
    t.assert.ok((await t.value("docker-compose.yml")).includes("image: nginx"));
    await t.fill(input, "docker run nginx");
    await t.hasNot("not translatable");
    await t.hasNot("not yet implemented");
    await t.hasNot("errors occurred");
  } },
  { slug: "docker-run-to-docker-compose-converter", name: "invalid, empty, pasted forms", async run(t) {
    await t.open();
    const input = "Your docker run command";
    const out = () => t.value("docker-compose.yml");
    await t.fill(input, "");
    t.assert.equal(await out(), "");
    await t.hasNot("errors occurred");
    t.assert.equal(await t.main().getByRole("button", { name: "Download docker-compose.yml" }).isDisabled(), true);
    await t.fill(input, "ls -la");
    await t.has("Enter a command that starts with docker run or docker create.");
    t.assert.equal(await out(), "");
    await t.fill(input, "docker run");
    await t.has("No image name found");
    t.assert.equal(await out(), "");
    await t.fill(input, 'docker run -e "A=b nginx');
    await t.has("unclosed quote");
    await t.fill(input, 'sudo docker run -d \\\n  -e X="y" \\\n  -p 80:80 \\\n  --name="web" nginx:latest');
    const yaml = await out();
    t.assert.ok(yaml.includes("image: 'nginx:latest'"), yaml);
    t.assert.ok(yaml.includes("- X=y"), yaml);
    t.assert.ok(yaml.includes("container_name: web"), yaml);
    t.assert.ok(yaml.includes("- '80:80'"), yaml);
  } },
  overflow("docker-run-to-docker-compose-converter", (t) => t.fill("Your docker run command", "docker run --rm --gpus all --bogus-flag --name a-very-long-container-name-that-goes-on-and-on-and-on-and-on-and-on nginx")),
  // xml-formatter
  { slug: "xml-formatter", name: "it-tools vectors and options", async run(t) {
    await t.open();
    const out = () => t.value("Formatted XML from your XML");
    t.assert.equal(await out(), "<hello>\n  <world>foo</world>\n  <world>bar</world>\n</hello>");
    await t.fill("Your XML", "<foo><bar>baz</bar><bar>baz</bar></foo>");
    t.assert.equal(await out(), "<foo>\n  <bar>baz</bar>\n  <bar>baz</bar>\n</foo>");
    t.assert.equal(await copyIn(t, "Formatted XML from your XML"), "<foo>\n  <bar>baz</bar>\n  <bar>baz</bar>\n</foo>");
    await t.fill("Indent size", "4");
    await t.page.getByLabel("Collapse content").uncheck();
    await t.page.waitForTimeout(80);
    await t.fill("Your XML", "<hello><world>foo</world><world>bar</world></hello>");
    t.assert.equal(await out(), "<hello>\n    <world>\n        foo\n    </world>\n    <world>\n        bar\n    </world>\n</hello>");
    await t.fill("Indent size", "0");
    t.assert.equal(await out(), "<hello>\n<world>\nfoo\n</world>\n<world>\nbar\n</world>\n</hello>");
  } },
  { slug: "xml-formatter", name: "invalid and empty", async run(t) {
    await t.open();
    for (const bad of ["hello world", "<a><b></a>", "<unclosed>", "<a/><b/>"]) {
      await t.fill("Your XML", bad);
      await t.has("Provided XML is not valid");
      t.assert.equal(await t.value("Formatted XML from your XML"), "", bad);
    }
    await t.fill("Your XML", "");
    await t.hasNot("not valid");
    t.assert.equal(await t.value("Formatted XML from your XML"), "");
    await t.fill("Your XML", "   ");
    await t.hasNot("not valid");
  } },
  { slug: "xml-formatter", name: "persists settings", async run(t) {
    await t.open();
    await t.page.getByLabel("Collapse content").uncheck();
    await t.fill("Indent size", "1");
    await t.page.waitForTimeout(100);
    await t.open();
    t.assert.equal(await t.value("Indent size"), "1");
    t.assert.equal(await t.page.getByLabel("Collapse content").isChecked(), false);
    t.assert.equal(await t.value("Formatted XML from your XML"), "<hello>\n <world>\n  foo\n </world>\n <world>\n  bar\n </world>\n</hello>");
  } },
  overflow("xml-formatter"),
  // yaml-prettify
  { slug: "yaml-prettify", name: "empty is clean, vectors, options, multi-document", async run(t) {
    await t.open();
    const out = () => t.value("Prettified version of your YAML");
    t.assert.equal(await out(), "");
    await t.hasNot("not valid");
    await t.fill("Your raw YAML", "z:   1\na:\n    b:   [1,  2]");
    t.assert.equal(await out(), "z: 1\na:\n  b:\n    - 1\n    - 2\n");
    t.assert.equal(await copyIn(t, "Prettified version of your YAML"), "z: 1\na:\n  b:\n    - 1\n    - 2\n");
    await t.page.getByLabel("Sort keys").check();
    await t.page.waitForTimeout(80);
    t.assert.equal(await out(), "a:\n  b:\n    - 1\n    - 2\nz: 1\n");
    await t.fill("Indent size", "4");
    t.assert.equal(await out(), "a:\n    b:\n        - 1\n        - 2\nz: 1\n");
    await t.fill("Indent size", "2");
    await t.fill("Your raw YAML", "kind:   Pod\n---\nkind: Service\n");
    t.assert.equal(await out(), "kind: Pod\n---\nkind: Service\n");
    await t.hasNot("not valid");
    await t.fill("Your raw YAML", "# only a comment");
    t.assert.equal(await out(), "");
  } },
  { slug: "yaml-prettify", name: "invalid", async run(t) {
    await t.open();
    await t.fill("Your raw YAML", "a: 1\na: 2");
    await t.has("Provided YAML is not valid: Map keys must be unique at line 2, column 1.");
    t.assert.equal(await t.value("Prettified version of your YAML"), "");
    await t.fill("Your raw YAML", "not: [unterminated");
    await t.has("Provided YAML is not valid");
    await t.fill("Your raw YAML", "");
    await t.hasNot("not valid");
    t.assert.equal(await t.value("Prettified version of your YAML"), "");
  } },
  { slug: "yaml-prettify", name: "persists settings but not the YAML", async run(t) {
    await t.open();
    await t.page.getByLabel("Sort keys").check();
    await t.fill("Indent size", "6");
    await t.fill("Your raw YAML", "secret: 1");
    await t.page.waitForTimeout(100);
    t.assert.ok(!JSON.stringify(await t.page.evaluate(() => ({ ...localStorage }))).includes("secret"));
    await t.open();
    t.assert.equal(await t.value("Indent size"), "6");
    t.assert.equal(await t.page.getByLabel("Sort keys").isChecked(), true);
    t.assert.equal(await t.value("Your raw YAML"), "");
    await t.fill("Your raw YAML", "b: {a: 1}\na: 2");
    t.assert.equal(await t.value("Prettified version of your YAML"), "a: 2\nb:\n      a: 1\n");
  } },
  overflow("yaml-prettify"),
  // email-normalizer
  { slug: "email-normalizer", name: "normalizes, flags bad lines, clears, copies", async run(t) {
    await t.open();
    const out = () => t.value("Normalized emails");
    t.assert.equal(await out(), "");
    await t.fill("Raw emails to normalize", "John.Doe+tag@Gmail.com\na.b+c@googlemail.com\nUser@Example.COM\nnope\n\nu.ser+x@hotmail.com\n");
    t.assert.equal(await out(), "johndoe@gmail.com\nab@gmail.com\nuser@example.com\nUnable to parse email: nope\n\nu.ser@hotmail.com\n");
    await t.fill("Raw emails to normalize", "John.Doe+tag@Gmail.com");
    t.assert.equal(await copyIn(t, "Normalized emails"), "johndoe@gmail.com");
    await t.click("Clear emails");
    t.assert.equal(await t.value("Raw emails to normalize"), "");
    t.assert.equal(await out(), "");
    t.assert.equal(await fieldOf(t, "Normalized emails").getByRole("button", { name: /copy/i }).first().isDisabled(), true);
  } },
  overflow("email-normalizer"),
  // regex-tester
  { slug: "regex-tester", name: "matches with captures and groups, sample, and diagram", async run(t) {
    await t.open();
    await t.has("No match");
    await t.fill("Regex to test", "(.)(?<g>r)");
    await t.fill("Text to match", "azertyr");
    await t.page.waitForFunction(() => document.querySelectorAll(".rt-table tbody tr").length === 2, null, { timeout: 15000 });
    const rows = await t.main().locator(".rt-table tbody tr").allInnerTexts();
    t.assert.ok(rows[0].startsWith("2"), rows[0]);
    for (const piece of ["er", '"1" = e [2 - 3]', '"2" = r [3 - 4]', '"g" = r [3 - 4]']) t.assert.ok(rows[0].includes(piece), piece);
    for (const piece of ["yr", '"1" = y [5 - 6]', '"g" = r [6 - 7]']) t.assert.ok(rows[1].includes(piece), piece);
    t.assert.deepEqual(await t.main().locator(".rt-highlight__mark").allInnerTexts(), ["er", "yr"]);
    await t.fill("Regex to test", "[0-9]{3}-x");
    await t.page.waitForFunction(() => /\d{3}-x/.test(document.querySelector("main").innerText), null, { timeout: 15000 });
    await t.has("Sample matching text");
    await t.page.waitForFunction(() => document.querySelector(".rt-diagram")?.shadowRoot?.querySelector("svg text"), null, { timeout: 30000 });
    t.assert.ok(await t.page.evaluate(() => document.querySelector(".rt-diagram").shadowRoot.querySelector("svg").textContent.includes("-x")));
  } },
  { slug: "regex-tester", name: "flags change results", async run(t) {
    await t.open();
    const rows = async (n) => { await t.page.waitForFunction((c) => document.querySelectorAll(".rt-table tbody tr").length === c, n, { timeout: 15000 }); return t.main().locator(".rt-table tbody tr").allInnerTexts(); };
    const flag = (letter) => t.page.locator(`#rt-flag-${letter}`);
    await t.fill("Regex to test", "a");
    await t.fill("Text to match", "aAa");
    await rows(2);
    await flag("i").check();
    await rows(3);
    await flag("g").uncheck();
    await rows(1);
    await flag("g").check();
    await flag("i").uncheck();
    // multiline
    await t.fill("Regex to test", "^b");
    await t.fill("Text to match", "a\nb\nb");
    await t.has("No match");
    await flag("m").check();
    await rows(2);
    await flag("m").uncheck();
    // dotAll, on by default
    await t.fill("Regex to test", "a.b");
    await t.fill("Text to match", "a\nb");
    await rows(1);
    await flag("s").uncheck();
    await t.page.waitForTimeout(300);
    await t.has("No match");
    await flag("s").check();
    // unicode, on by default: one match per code point
    await t.fill("Regex to test", "^.$");
    await t.fill("Text to match", "😀");
    await rows(1);
    await flag("u").uncheck();
    await t.page.waitForTimeout(300);
    await t.has("No match");
    // unicode sets
    await flag("v").check();
    await t.fill("Regex to test", "[\\p{L}--[a-z]]");
    await t.fill("Text to match", "aB");
    t.assert.deepEqual((await rows(1))[0].includes("B"), true);
    await flag("u").check();
    t.assert.equal(await flag("v").isChecked(), false);
    await t.has("Invalid regex");
    await flag("v").check();
    t.assert.equal(await flag("u").isChecked(), false);
    await t.hasNot("Invalid regex");
    await flag("u").check();
    // sticky
    await t.fill("Regex to test", "a");
    await t.fill("Text to match", "aab a");
    await rows(3);
    await flag("y").check();
    const sticky = await rows(2);
    t.assert.ok(sticky[0].startsWith("0") && sticky[1].startsWith("1"), sticky.join("|"));
    await t.fill("Text to match", "baa");
    await t.page.waitForTimeout(300);
    await t.has("No match");
  } },
  { slug: "regex-tester", name: "bugs: unset groups, zero-length, flag-dependent syntax", async run(t) {
    await t.open();
    await t.fill("Regex to test", "(a)|(b)");
    await t.fill("Text to match", "b");
    await t.page.waitForSelector(".rt-table tbody tr", { timeout: 15000 });
    await t.has('"1" did not match');
    await t.has('"2" = b [0 - 1]');
    await t.fill("Regex to test", "a*");
    await t.fill("Text to match", "baaa");
    await t.page.waitForFunction(() => document.querySelector(".rt-highlight__mark")?.innerText === "aaa", null, { timeout: 15000 });
    await t.fill("Regex to test", "\\-");
    await t.has("Invalid regex");
    await t.page.locator("#rt-flag-u").uncheck();
    await t.page.waitForTimeout(80);
    await t.hasNot("Invalid regex");
    await t.fill("Text to match", "x-y");
    await t.page.waitForFunction(() => document.querySelector(".rt-highlight__mark")?.innerText === "-", null, { timeout: 15000 });
    await t.fill("Regex to test", "(a");
    await t.has("Invalid regex");
    await t.has("No match");
    await t.fill("Regex to test", "");
    await t.hasNot("Invalid regex");
    await t.has("No match");
  } },
  { slug: "regex-tester", name: "catastrophic pattern is stopped and the page recovers", async run(t) {
    await t.open();
    await t.fill("Text to match", CATASTROPHIC);
    // Warm the worker so the stuck run below is the one being timed.
    await t.fill("Regex to test", "a");
    await t.page.waitForFunction(() => document.querySelector(".rt-table tbody tr"), null, { timeout: 15000 });
    await t.fill("Regex to test", "(a+)+$");
    const started = Date.now();
    await t.page.waitForFunction(() => document.querySelector("main").innerText.includes("took too long"), null, { timeout: 8000 });
    t.assert.ok(Date.now() - started < 6000, "timeout message should appear promptly");
    t.assert.equal(await t.page.evaluate(() => 1 + 1), 2);
    await t.hasNot("No match");
    t.assert.equal(await t.main().locator(".rt-table tbody tr").count(), 0);
    await t.fill("Regex to test", "a{2}");
    await t.page.waitForFunction(() => document.querySelectorAll(".rt-table tbody tr").length === 20, null, { timeout: 15000 });
    await t.hasNot("took too long");
    // Typing past a stuck pattern must not wait for its timeout to finish.
    await t.fill("Regex to test", "(a+)+$");
    await t.fill("Regex to test", "!");
    await t.page.waitForFunction(() => document.querySelector(".rt-highlight__mark")?.innerText === "!", null, { timeout: 1200 });
  } },
  { slug: "regex-tester", name: "huge repeat in the sample generator does not hang the page", async run(t) {
    await t.open();
    await t.fill("Regex to test", "a{900000000}");
    await t.fill("Text to match", "aaa");
    await t.page.waitForFunction(() => document.querySelector("main").innerText.includes("took too long") || document.querySelector("main").innerText.includes("No match"), null, { timeout: 8000 });
    t.assert.equal(await t.page.evaluate(() => 2 + 2), 4);
  } },
  { slug: "regex-tester", name: "large match count is capped", async run(t) {
    await t.open();
    await t.fill("Text to match", "a".repeat(5000));
    await t.fill("Regex to test", "a");
    await t.page.waitForFunction(() => document.querySelector("main").innerText.includes("Showing the first 1,000 matches"), null, { timeout: 15000 });
    t.assert.equal(await t.main().locator(".rt-table tbody tr").count(), 1000);
  } },
  { slug: "regex-tester", name: "regex lives in the URL and links to the cheatsheet", async run(t) {
    await t.open("?regex=b%2B");
    t.assert.equal(await t.value("Regex to test"), "b+");
    await t.fill("Text to match", "abbbc");
    await t.page.waitForFunction(() => document.querySelector(".rt-highlight__mark")?.innerText === "bbb", null, { timeout: 15000 });
    await t.fill("Regex to test", "x y");
    await t.page.waitForTimeout(100);
    t.assert.ok(t.page.url().includes("regex=x+y") || t.page.url().includes("regex=x%20y"), t.page.url());
    await t.page.reload({ waitUntil: "load" });
    await t.page.waitForFunction(() => document.querySelector("#rt-regex"), null, { timeout: 30000 });
    t.assert.equal(await t.value("Regex to test"), "x y");
    t.assert.equal(await t.main().getByRole("link", { name: "Regular Expression Cheatsheet" }).getAttribute("href"), "/tools/regex-memo");
  } },
  overflow("regex-tester", async (t) => {
    await t.fill("Regex to test", "(?<word>[a-z]+)(\\d+)?");
    await t.fill("Text to match", "averyveryveryveryveryveryveryveryveryveryveryveryverylongwordwithoutanybreakopportunitiesatall 12 abc");
    await t.page.waitForSelector(".rt-table tbody tr", { timeout: 15000 });
  }),
  // regex-memo
  { slug: "regex-memo", name: "cheatsheet, search, copy, and links", async run(t) {
    await t.open();
    await t.has("50 results");
    t.assert.ok((await t.text()).toLowerCase().includes("characters that require escaping"));
    await t.has("(?<=bar)foo");
    await t.has("RegExplained");
    await t.main().getByRole("button", { name: "Copy \\d or [0-9]" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "\\d");
    await t.fill("Search regex expressions", "backreference");
    await t.has("(foo)bar\\1");
    await t.hasNot("(?<=bar)foo");
    await t.fill("Search regex expressions", "zzzz");
    await t.has("No regex patterns match this search");
    t.assert.equal(await t.main().getByRole("link", { name: "Regex tester" }).first().getAttribute("href"), "/tools/regex-tester");
  } },
  overflow("regex-memo"),
  // phone-parser-and-formatter
  { slug: "phone-parser-and-formatter", name: "parses with spaces and formats", async run(t) {
    await t.open();
    t.assert.equal(await t.main().locator(".ui-key-value__item").count(), 0);
    await t.fill("Phone number", " +33 6 12 34 56 78 ");
    t.assert.deepEqual(await kv(t), [
      ["Country code", "FR"], ["Country", "France"], ["Country calling code", "33"], ["Is valid?", "Yes"], ["Is possible?", "Yes"], ["Type", "Mobile"],
      ["International format", "+33 6 12 34 56 78"], ["National format", "06 12 34 56 78"], ["E.164 format", "+33612345678"], ["RFC3966 format", "tel:+33612345678"],
    ]);
    await t.main().getByRole("button", { name: "Copy E.164 format" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "+33612345678");
  } },
  { slug: "phone-parser-and-formatter", name: "default country applies only without a prefix", async run(t) {
    await t.open();
    await t.field("Default country code").selectOption("US");
    await t.fill("Phone number", "(212) 555-1212");
    let info = await kvMap(t);
    t.assert.equal(info["E.164 format"], "+12125551212");
    t.assert.equal(info["National format"], "(212) 555-1212");
    await t.fill("Phone number", "212.555.1212");
    t.assert.equal((await kvMap(t))["E.164 format"], "+12125551212");
    await t.field("Default country code").selectOption("FR");
    await t.fill("Phone number", "01 23 45 67 89");
    info = await kvMap(t);
    t.assert.equal(info["E.164 format"], "+33123456789");
    t.assert.equal(info["Type"], "Fixed line");
    await t.field("Default country code").selectOption("DE");
    await t.fill("Phone number", "+1 212 555 1212");
    t.assert.equal((await kvMap(t))["Country code"], "US");
  } },
  { slug: "phone-parser-and-formatter", name: "invalid input explains itself and leaves no results", async run(t) {
    await t.open();
    await t.field("Default country code").selectOption("US");
    for (const [bad, message] of [["abc", "Invalid phone number"], ["1", "too short"], ["+", "does not look like a phone number"], ["+999 123 456", "calling code is not recognized"]]) {
      await t.fill("Phone number", bad);
      await t.has(message);
      t.assert.equal(await t.main().locator(".ui-key-value__item").count(), 0, bad);
    }
    await t.fill("Phone number", "+1 123 555 1212");
    t.assert.equal((await kvMap(t))["Is valid?"], "No");
    await t.fill("Phone number", "");
    await t.hasNot("Invalid phone number");
    await t.hasNot("too short");
    t.assert.equal(await t.main().locator(".ui-key-value__item").count(), 0);
  } },
  overflow("phone-parser-and-formatter", (t) => t.fill("Phone number", "+33 6 12 34 56 78")),
  // iban-validator-and-parser
  { slug: "iban-validator-and-parser", name: "it-tools vectors", async run(t) {
    await t.open();
    t.assert.equal(await t.main().locator(".ui-key-value__item").count(), 0);
    await fillId(t, "#iban-input", "DE89370400440532013000");
    t.assert.deepEqual(await kv(t), [["Is IBAN valid?", "Yes"], ["Is IBAN a QR-IBAN?", "No"], ["Country code", "DE"], ["BBAN", "370400440532013000"], ["IBAN friendly format", "DE89 3704 0044 0532 0130 00"]]);
    await fillId(t, "#iban-input", "FR7630006060011234567890189");
    const info = await kvMap(t);
    t.assert.equal(info["Is IBAN valid?"], "No");
    t.assert.equal(info["IBAN errors"].replace(/\s+/g, " "), "Wrong account bank branch checksum Wrong IBAN checksum");
    t.assert.equal(info["Country code"], "N/A");
    t.assert.equal(info["BBAN"], "N/A");
    t.assert.equal(info["IBAN friendly format"], "FR76 3000 6060 0112 3456 7890 189");
  } },
  { slug: "iban-validator-and-parser", name: "spaces, checksums, QR, garbage, examples", async run(t) {
    await t.open();
    await fillId(t, "#iban-input", " de89 3704-0044 0532 0130 00 ");
    t.assert.equal((await kvMap(t))["Is IBAN valid?"], "Yes");
    await fillId(t, "#iban-input", "DE88 3704 0044 0532 0130 00");
    let info = await kvMap(t);
    t.assert.equal(info["Is IBAN valid?"], "No");
    t.assert.equal(info["IBAN errors"], "Wrong IBAN checksum");
    await fillId(t, "#iban-input", "CH44 3199 9123 0008 8901 2");
    info = await kvMap(t);
    t.assert.equal(info["Is IBAN valid?"], "Yes");
    t.assert.equal(info["Is IBAN a QR-IBAN?"], "Yes");
    for (const bad of ["hello", "!!!", "12", "ÉÉ"]) {
      await fillId(t, "#iban-input", bad);
      info = await kvMap(t);
      t.assert.equal(info["Is IBAN valid?"], "No", bad);
      t.assert.ok(info["IBAN errors"], bad);
    }
    await fillId(t, "#iban-input", "   ");
    t.assert.equal(await t.main().locator(".ui-key-value__item").count(), 0);
    await t.click("GB29 NWBK 6016 1331 9268 19");
    t.assert.equal(await t.page.locator("#iban-input").inputValue(), "GB29NWBK60161331926819");
    t.assert.equal((await kvMap(t))["Is IBAN valid?"], "Yes");
    await t.main().getByRole("button", { name: "Copy example IBAN" }).first().click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "FR7630006000011234567890189");
    await t.main().getByRole("button", { name: "Copy BBAN" }).click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.clipboard(), "NWBK60161331926819");
  } },
  overflow("iban-validator-and-parser", (t) => fillId(t, "#iban-input", "FR7630006060011234567890189")),
];
