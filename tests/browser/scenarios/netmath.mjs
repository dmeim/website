import crypto from "node:crypto";
import { execFileSync } from "node:child_process";

const mobile = { width: 375, height: 800 };
const tid = (t, id) => t.page.getByTestId(id).innerText();
const val = (t, id) => t.page.locator(`#${id}`).inputValue();
const setVal = async (t, id, v) => { await t.page.locator(`#${id}`).fill(String(v)); await t.page.waitForTimeout(80); };
const overflow = (slug, extra) => ({ slug, name: "no overflow at 375", viewport: mobile, async run(t) { await t.open(); if (extra) await extra(t); await t.noOverflow(); } });
const reload = async (t) => {
  await t.page.reload({ waitUntil: "load" });
  await t.page.waitForFunction(() => !document.querySelector(".tools-mount__loading") && !document.querySelector(".tools-shell-fallback") && (document.querySelector("main")?.innerText?.length ?? 0) > 20, null, { timeout: 60000 });
  await t.page.waitForTimeout(150);
};
const btn = (t, name) => t.main().getByRole("button", { name, exact: true });
// Second, independent source: python's ipaddress and RFC 4193's fc00::/7 + L bit.
const pyUla = (ula, first, last) => JSON.parse(execFileSync("python3", ["-I", "-c", `
import ipaddress as i, json, sys
u=i.ip_network(sys.argv[1]); f=i.ip_network(sys.argv[2]); l=i.ip_network(sys.argv[3])
subs=list(u.subnets(new_prefix=64)) if False else None
print(json.dumps(dict(prefix=u.prefixlen, inUla=u.subnet_of(i.ip_network("fc00::/7")), lBit=u.subnet_of(i.ip_network("fd00::/8")), firstOk=f==next(u.subnets(new_prefix=64)), lastOk=l==i.ip_network((int(u.network_address)+(0xffff<<64),64)), fp=f.prefixlen, lp=l.prefixlen)))
`, ula, first, last]).toString());

export default [
  // ipv4-subnet-calculator
  { slug: "ipv4-subnet-calculator", name: "default vector", async run(t) {
    await t.open();
    t.assert.equal(await t.value("An IPv4 address with or without mask"), "192.168.0.1/24");
    const want = { netmask: "192.168.0.0/24", networkAddress: "192.168.0.0", networkMask: "255.255.255.0", networkMaskBinary: "11111111.11111111.11111111.00000000", cidr: "/24", wildcardMask: "0.0.0.255", networkSize: "256", firstAddress: "192.168.0.1", lastAddress: "192.168.0.254", broadcastAddress: "192.168.0.255", ipClass: "C" };
    for (const [k, v] of Object.entries(want)) t.assert.equal(await tid(t, k), v, k);
  } },
  { slug: "ipv4-subnet-calculator", name: "/0, /31, /32 edges", async run(t) {
    await t.open();
    await t.fill("An IPv4 address with or without mask", "0.0.0.0/0");
    t.assert.equal(await tid(t, "networkSize"), "4294967296");
    t.assert.equal(await tid(t, "networkMask"), "0.0.0.0");
    t.assert.equal(await tid(t, "wildcardMask"), "255.255.255.255");
    t.assert.equal(await tid(t, "firstAddress"), "0.0.0.1");
    t.assert.equal(await tid(t, "lastAddress"), "255.255.255.254");
    t.assert.equal(await tid(t, "broadcastAddress"), "255.255.255.255");
    t.assert.ok(await btn(t, "Next block").isDisabled());
    t.assert.ok(await btn(t, "Previous block").isDisabled());
    await t.fill("An IPv4 address with or without mask", "10.0.0.0/31");
    t.assert.equal(await tid(t, "firstAddress"), "10.0.0.0");
    t.assert.equal(await tid(t, "lastAddress"), "10.0.0.1");
    t.assert.equal(await tid(t, "broadcastAddress"), "No broadcast address with this mask");
    await t.fill("An IPv4 address with or without mask", "255.255.255.255");
    t.assert.equal(await tid(t, "netmask"), "255.255.255.255/32");
    t.assert.equal(await tid(t, "networkSize"), "1");
    t.assert.equal(await tid(t, "ipClass"), "E");
    t.assert.equal(await tid(t, "broadcastAddress"), "No broadcast address with this mask");
  } },
  { slug: "ipv4-subnet-calculator", name: "block navigation stops at the ends", async run(t) {
    await t.open();
    await t.click("Next block");
    t.assert.equal(await t.value("An IPv4 address with or without mask"), "192.168.1.0/24");
    await t.has("Moved to next block.");
    await t.click("Previous block");
    await t.click("Previous block");
    t.assert.equal(await t.value("An IPv4 address with or without mask"), "192.167.255.0/24");
    await t.fill("An IPv4 address with or without mask", "255.255.254.0/24");
    t.assert.ok(await btn(t, "Next block").isEnabled());
    await t.click("Next block");
    t.assert.equal(await t.value("An IPv4 address with or without mask"), "255.255.255.0/24");
    t.assert.ok(await btn(t, "Next block").isDisabled());
    await t.fill("An IPv4 address with or without mask", "0.0.0.0/24");
    t.assert.ok(await btn(t, "Previous block").isDisabled());
    t.assert.ok(await btn(t, "Next block").isEnabled());
  } },
  { slug: "ipv4-subnet-calculator", name: "invalid, empty, dotted mask, copy, persistence", async run(t) {
    await t.open();
    for (const bad of ["not an ip", "1.2", "192.168.0.1/33", "192.168.0.1/-1", "::1", "256.1.1.1", "010.0.0.1"]) {
      await t.fill("An IPv4 address with or without mask", bad);
      await t.has("We cannot parse this address");
      await t.hasNot("Network mask in binary");
    }
    await t.fill("An IPv4 address with or without mask", "");
    await t.hasNot("We cannot parse");
    await t.hasNot("Network mask in binary");
    await t.fill("An IPv4 address with or without mask", "10.1.2.3/255.255.0.0");
    t.assert.equal(await tid(t, "netmask"), "10.1.0.0/16");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    t.assert.equal(await t.clipboard(), "10.1.0.0/16");
    await reload(t);
    t.assert.equal(await t.value("An IPv4 address with or without mask"), "10.1.2.3/255.255.0.0");
    t.assert.equal(await tid(t, "netmask"), "10.1.0.0/16");
  } },
  overflow("ipv4-subnet-calculator", (t) => t.fill("An IPv4 address with or without mask", "0.0.0.0/0")),

  // ipv4-address-converter
  { slug: "ipv4-address-converter", name: "vectors, edges, copy, persistence", async run(t) {
    await t.open();
    t.assert.equal(await tid(t, "decimal"), "3232235777");
    t.assert.equal(await tid(t, "hexadecimal"), "C0A80101");
    t.assert.equal(await tid(t, "binary"), "11000000101010000000000100000001");
    t.assert.equal(await tid(t, "ipv6"), "0000:0000:0000:0000:0000:ffff:c0a8:0101");
    t.assert.equal(await tid(t, "ipv6Short"), "::ffff:c0a8:101");
    await t.fill("The IPv4 address", "255.255.255.255");
    t.assert.equal(await tid(t, "decimal"), "4294967295");
    t.assert.equal(await tid(t, "hexadecimal"), "FFFFFFFF");
    await t.fill("The IPv4 address", "0.0.0.0");
    t.assert.equal(await tid(t, "decimal"), "0");
    t.assert.equal(await tid(t, "ipv6Short"), "::ffff:0:0");
    await t.fill("The IPv4 address", "10.0.0.1");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    t.assert.equal(await t.clipboard(), "167772161");
    await reload(t);
    t.assert.equal(await t.value("The IPv4 address"), "10.0.0.1");
    t.assert.equal(await tid(t, "decimal"), "167772161");
  } },
  { slug: "ipv4-address-converter", name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("The IPv4 address", "256.1.1.1");
    await t.has("Invalid IPv4 address");
    await t.has("Set a correct IPv4 address");
    await t.hasNot("ffff");
    await t.fill("The IPv4 address", "");
    await t.hasNot("Invalid IPv4 address");
    await t.has("Set a correct IPv4 address");
  } },
  overflow("ipv4-address-converter"),

  // ipv4-range-expander
  { slug: "ipv4-range-expander", name: "defaults and python vectors", async run(t) {
    await t.open();
    t.assert.equal(await tid(t, "cidr.new"), "192.168.0.0/21");
    t.assert.equal(await tid(t, "start-address.new"), "192.168.0.0");
    t.assert.equal(await tid(t, "end-address.new"), "192.168.7.255");
    t.assert.equal(await tid(t, "addresses-in-range.old"), "1,535");
    t.assert.equal(await tid(t, "addresses-in-range.new"), "2,048");
    t.assert.equal(await tid(t, "cidr.old"), "–");
    for (const [a, b, cidr, size] of [["0.0.0.0", "255.255.255.255", "0.0.0.0/0", "4,294,967,296"], ["127.255.255.255", "128.0.0.0", "0.0.0.0/0", "4,294,967,296"], ["10.0.0.5", "10.0.0.5", "10.0.0.5/32", "1"], ["255.255.255.0", "255.255.255.255", "255.255.255.0/24", "256"], ["172.16.3.200", "172.16.4.1", "172.16.0.0/21", "2,048"]]) {
      await t.fill("Start address", a);
      await t.fill("End address", b);
      t.assert.equal(await tid(t, "cidr.new"), cidr);
      t.assert.equal(await tid(t, "addresses-in-range.new"), size);
    }
  } },
  { slug: "ipv4-range-expander", name: "inverted, switch, invalid, empty", async run(t) {
    await t.open();
    await t.fill("Start address", "192.168.7.1");
    await t.fill("End address", "192.168.6.255");
    await t.has("end address is lower");
    await t.hasNot("New value");
    await t.click("Switch start and end");
    t.assert.equal(await t.value("Start address"), "192.168.6.255");
    t.assert.equal(await t.value("End address"), "192.168.7.1");
    await t.has("New value");
    await t.hasNot("end address is lower");
    await t.fill("Start address", "bad");
    await t.has("Invalid start IPv4 address");
    await t.hasNot("New value");
    await t.hasNot("end address is lower");
    await t.fill("End address", "1.1.1");
    await t.has("Invalid end IPv4 address");
    await t.main().getByRole("button", { name: /clear/i }).first().click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.value("Start address"), "");
    await t.fill("End address", "");
    await t.hasNot("Invalid");
    await t.hasNot("New value");
  } },
  { slug: "ipv4-range-expander", name: "copy and persistence", async run(t) {
    await t.open();
    await t.fill("Start address", "10.0.0.1");
    await t.fill("End address", "10.0.0.17");
    t.assert.equal(await tid(t, "cidr.new"), "10.0.0.0/27");
    await t.main().getByRole("button", { name: "Copy CIDR (new)" }).click();
    t.assert.equal(await t.clipboard(), "10.0.0.0/27");
    await reload(t);
    t.assert.equal(await t.value("Start address"), "10.0.0.1");
    t.assert.equal(await t.value("End address"), "10.0.0.17");
    t.assert.equal(await tid(t, "addresses-in-range.old"), "17");
  } },
  overflow("ipv4-range-expander"),

  // mac-address-lookup
  { slug: "mac-address-lookup", name: "vendor, formats, copy", async run(t) {
    await t.open();
    t.assert.ok((await tid(t, "vendor-info")).includes("Cisco Systems"));
    await t.click("Copy vendor info");
    t.assert.ok((await t.clipboard()).startsWith("Cisco Systems"));
    for (const form of ["20.37.06.12.34.56", "203706123456", "2037.0612.3456", "20-37-06-12-34-56", "20:37:06", "  20:37:06:12:34:56 "]) {
      await setVal(t, "maclookup-mac", form);
      await t.hasNot("Invalid MAC address");
      t.assert.ok((await tid(t, "vendor-info")).includes("Cisco Systems"), form);
    }
  } },
  { slug: "mac-address-lookup", name: "unknown, invalid, empty", async run(t) {
    await t.open();
    await setVal(t, "maclookup-mac", "FF:FF:FF:12:34:56");
    await t.has("Unknown vendor for this address");
    t.assert.ok(await t.main().getByRole("button", { name: "Copy vendor info" }).isDisabled());
    await setVal(t, "maclookup-mac", "20:37:06:1");
    await t.has("Invalid MAC address");
    await t.hasNot("Cisco");
    await setVal(t, "maclookup-mac", "");
    await t.hasNot("Invalid MAC address");
    await t.has("Enter a MAC address to see its vendor.");
    t.assert.ok(await t.main().getByRole("button", { name: "Copy vendor info" }).isDisabled());
  } },
  overflow("mac-address-lookup"),

  // mac-address-generator
  { slug: "mac-address-generator", name: "defaults, separators, case", async run(t) {
    await t.open();
    t.assert.match(await val(t, "macgen-output"), /^64:16:7F:[0-9A-F]{2}:[0-9A-F]{2}:[0-9A-F]{2}$/);
    await t.main().getByRole("radio", { name: "-", exact: true }).check();
    await t.page.waitForTimeout(80);
    t.assert.match(await val(t, "macgen-output"), /^64-16-7F-[0-9A-F]{2}-[0-9A-F]{2}-[0-9A-F]{2}$/);
    await t.main().getByRole("radio", { name: ".", exact: true }).check();
    await t.page.waitForTimeout(80);
    t.assert.match(await val(t, "macgen-output"), /^64\.16\.7F\.[0-9A-F]{2}\.[0-9A-F]{2}\.[0-9A-F]{2}$/);
    await t.main().getByRole("radio", { name: "None", exact: true }).check();
    await t.page.waitForTimeout(80);
    t.assert.match(await val(t, "macgen-output"), /^64167F[0-9A-F]{6}$/);
    await t.main().getByRole("radio", { name: "Lowercase", exact: true }).check();
    await t.page.waitForTimeout(80);
    t.assert.match(await val(t, "macgen-output"), /^64167f[0-9a-f]{6}$/);
  } },
  { slug: "mac-address-generator", name: "quantity, prefix variants, refresh, copy", async run(t) {
    await t.open();
    await t.fill("Quantity", "");
    t.assert.equal(await t.value("Quantity"), "", "the field can be cleared while typing");
    await t.fill("Quantity", "5");
    let lines = (await val(t, "macgen-output")).split("\n");
    t.assert.equal(lines.length, 5);
    t.assert.equal(new Set(lines).size, 5);
    await t.fill("Quantity", "999");
    t.assert.equal((await val(t, "macgen-output")).split("\n").length, 100);
    await t.fill("Quantity", "2");
    const before = await val(t, "macgen-output");
    await t.click("Refresh");
    t.assert.notEqual(await val(t, "macgen-output"), before);
    await t.has("MAC addresses refreshed.");
    const shown = await val(t, "macgen-output");
    await t.click("Copy");
    t.assert.equal(await t.clipboard(), shown);
    await t.fill("MAC address prefix", "ff:ee:a");
    t.assert.match((await val(t, "macgen-output")).split("\n")[0], /^FF:EE:0A:[0-9A-F:]{8}$/);
    await t.fill("MAC address prefix", "aabbcc");
    t.assert.match((await val(t, "macgen-output")).split("\n")[0], /^AA:BB:CC:[0-9A-F:]{8}$/);
    await t.fill("MAC address prefix", "01:23:45:67:89:AB");
    t.assert.equal((await val(t, "macgen-output")).split("\n")[0], "01:23:45:67:89:AB");
    await t.fill("MAC address prefix", "");
    t.assert.match((await val(t, "macgen-output")).split("\n")[0], /^[0-9A-F]{2}(:[0-9A-F]{2}){5}$/);
    await t.hasNot("Invalid partial MAC");
  } },
  { slug: "mac-address-generator", name: "invalid prefix", async run(t) {
    await t.open();
    for (const bad of ["ZZ", "1:2", "01:23:45:67:89:AB:CD"]) {
      await t.fill("MAC address prefix", bad);
      await t.has("Invalid partial MAC address");
      t.assert.equal(await val(t, "macgen-output"), "");
      t.assert.ok(await btn(t, "Refresh").isDisabled());
      t.assert.ok(await btn(t, "Copy").isDisabled());
    }
  } },
  { slug: "mac-address-generator", name: "amount, prefix, and separator persist", async run(t) {
    await t.open();
    await t.fill("Quantity", "3");
    await t.fill("MAC address prefix", "AA:BB");
    await t.main().getByRole("radio", { name: "-", exact: true }).check();
    await t.page.waitForTimeout(100);
    await reload(t);
    t.assert.equal(await t.value("Quantity"), "3");
    t.assert.equal(await t.value("MAC address prefix"), "AA:BB");
    const lines = (await val(t, "macgen-output")).split("\n");
    t.assert.equal(lines.length, 3);
    t.assert.match(lines[0], /^AA-BB-[0-9A-F-]{11}$/);
  } },
  overflow("mac-address-generator"),

  // ipv6-ula-generator
  { slug: "ipv6-ula-generator", name: "exact SHA-1 vector and RFC 4193 shape", async run(t) {
    const ts = 1700000000000;
    await t.page.addInitScript((m) => { Date.now = () => m; }, ts);
    await t.open();
    const digest = crypto.createHash("sha1").update(`${ts}20:37:06:12:34:56`).digest("hex").slice(30);
    t.assert.equal(digest.length, 10);
    const prefix = `fd${digest.slice(0, 2)}:${digest.slice(2, 6)}:${digest.slice(6)}`;
    t.assert.equal(await tid(t, "ula"), `${prefix}::/48`);
    t.assert.equal(await tid(t, "firstRoutable"), `${prefix}:0::/64`);
    t.assert.equal(await tid(t, "lastRoutable"), `${prefix}:ffff::/64`);
    t.assert.deepEqual(pyUla(await tid(t, "ula"), await tid(t, "firstRoutable"), await tid(t, "lastRoutable")), { prefix: 48, inUla: true, lBit: true, firstOk: true, lastOk: true, fp: 64, lp: 64 });
  } },
  { slug: "ipv6-ula-generator", name: "refresh, copy, option change", async run(t) {
    await t.open();
    const first = await tid(t, "ula");
    t.assert.match(first, /^fd[0-9a-f]{2}:[0-9a-f]{4}:[0-9a-f]{4}::\/48$/);
    await t.page.waitForTimeout(20);
    await t.click("Refresh");
    await t.page.waitForTimeout(100);
    t.assert.notEqual(await tid(t, "ula"), first);
    await t.has("ULA regenerated.");
    const shown = await tid(t, "ula");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    t.assert.equal(await t.clipboard(), shown);
    await t.fill("MAC address", "AA-BB-CC-DD-EE-FF");
    await t.page.waitForTimeout(100);
    t.assert.notEqual(await tid(t, "ula"), shown);
  } },
  { slug: "ipv6-ula-generator", name: "invalid and empty", async run(t) {
    await t.open();
    await t.fill("MAC address", "nope");
    await t.has("Invalid MAC address");
    await t.hasNot("::/48");
    t.assert.ok(await btn(t, "Refresh").isDisabled());
    await t.fill("MAC address", "");
    await t.hasNot("Invalid MAC address");
    await t.hasNot("::/48");
  } },
  overflow("ipv6-ula-generator"),

  // math-evaluator
  { slug: "math-evaluator", name: "values and copy", async run(t) {
    await t.open();
    await t.hasNot("Result");
    await t.hasNot("could not evaluate");
    await t.fill("Expression", "2*sqrt(6)");
    t.assert.equal(await tid(t, "math-eval-result"), String(2 * Math.sqrt(6)));
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    t.assert.equal(await t.clipboard(), String(2 * Math.sqrt(6)));
    for (const [input, out] of [["sqrt(-4)", "2i"], ["sqrt(-1)", "i"], ["(1+2i)*(3-i)", "5 + 5i"], ["[1,2;3,4]*2", "[[2, 4], [6, 8]]"], ["100 cm to m", "1 m"], ["1/0", "Infinity"], ["1-1", "0"], ["1>2", "false"], ["x=3\nx+1", "[3, 4]"], ["sin", "function"], ["{a:1}", "{\"a\": 1}"]]) {
      await t.fill("Expression", input);
      t.assert.equal(await tid(t, "math-eval-result"), out, input);
    }
  } },
  { slug: "math-evaluator", name: "invalid input clears the result", async run(t) {
    await t.open();
    await t.fill("Expression", "1+1");
    t.assert.equal(await tid(t, "math-eval-result"), "2");
    for (const [bad, why] of [["2+", "Unexpected end of expression"], ["foo", "Undefined symbol foo"], ["foo(1)", "Undefined function foo"], ["1 cm + 1 s", "Units do not match"], ["(1", "Parenthesis"]]) {
      await t.fill("Expression", bad);
      await t.has("We could not evaluate this expression.");
      await t.has(why);
      t.assert.equal(await t.page.getByTestId("math-eval-result").count(), 0);
    }
    await t.fill("Expression", "");
    await t.hasNot("could not evaluate");
  } },
  overflow("math-evaluator", (t) => t.fill("Expression", "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40]*1000000")),

  // eta-calculator
  { slug: "eta-calculator", name: "defaults and examples with a fixed clock", async run(t) {
    const now = new Date(2026, 2, 10, 10, 0, 7).getTime();
    await t.page.addInitScript((m) => { Date.now = () => m; }, now);
    await t.open();
    t.assert.equal(await t.value("The consumption started at"), "2026-03-10T10:00:07");
    t.assert.ok((await tid(t, "eta-duration")).includes("5 hours 10 minutes"));
    t.assert.ok((await tid(t, "eta-end")).includes("today at 15:10"));
    // The page's own example: 5 plates in 3 minutes, 500 plates, 5 hours.
    await t.fill("Amount of element to consume", "500");
    await t.fill("Units", "5");
    await t.fill("In time span", "3");
    t.assert.ok((await tid(t, "eta-duration")).includes("5 hours"));
    t.assert.ok(!(await tid(t, "eta-duration")).includes("minute"));
    t.assert.ok((await tid(t, "eta-end")).includes("today at 15:00"));
    // Every unit changes the result.
    for (const [unit, dur] of [["milliseconds", "300 ms"], ["seconds", "5 minutes"], ["hours", "300 hours"], ["days", "7200 hours"]]) {
      await t.field("Unit", { exact: true }).selectOption({ label: unit });
      await t.page.waitForTimeout(60);
      t.assert.ok((await tid(t, "eta-duration")).includes(dur), `${unit}: ${await tid(t, "eta-duration")}`);
    }
    const end = new Date(now + 300 * 86400000);
    const pad = (n) => String(n).padStart(2, "0");
    t.assert.ok((await tid(t, "eta-end")).includes(`${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()}`));
    // The start time drives the end time.
    await t.field("Unit", { exact: true }).selectOption({ label: "minutes" });
    await t.fill("The consumption started at", "2026-03-10T12:00");
    t.assert.ok((await tid(t, "eta-end")).includes("today at 17:00"));
    await t.fill("The consumption started at", "2026-03-11T00:00");
    t.assert.ok((await tid(t, "eta-end")).includes("tomorrow at 05:00"));
  } },
  { slug: "eta-calculator", name: "no float noise", async run(t) {
    await t.open();
    await t.fill("Amount of element to consume", "3");
    await t.fill("Units", "0.3");
    await t.fill("In time span", "1");
    await t.field("Unit", { exact: true }).selectOption({ label: "seconds" });
    await t.page.waitForTimeout(60);
    const d = await tid(t, "eta-duration");
    t.assert.ok(d.includes("10 seconds") && !d.includes("ms"), d);
    await t.fill("Amount of element to consume", "1");
    await t.fill("Units", "3");
    await t.field("Unit", { exact: true }).selectOption({ label: "milliseconds" });
    await t.page.waitForTimeout(60);
    t.assert.ok((await tid(t, "eta-duration")).includes("less than 1 ms"));
  } },
  { slug: "eta-calculator", name: "invalid and empty", async run(t) {
    await t.open();
    for (const bad of ["0", "-5", ""]) {
      await t.fill("Units", bad);
      await t.has("Enter positive amounts and a valid start time");
      t.assert.ok((await tid(t, "eta-duration")).includes("–"), bad);
      t.assert.ok((await tid(t, "eta-end")).includes("–"), bad);
    }
    await t.fill("Units", "3");
    await t.hasNot("Enter positive amounts");
    await t.fill("In time span", "0");
    await t.has("Enter positive amounts");
    await t.fill("In time span", "5");
    await t.fill("The consumption started at", "");
    await t.has("Enter positive amounts");
    t.assert.ok((await tid(t, "eta-end")).includes("–"));
    await t.fill("Amount of element to consume", "1e30");
    await t.fill("The consumption started at", "2026-03-11T00:00");
    t.assert.ok((await tid(t, "eta-end")).includes("too far in the future"));
    await t.hasNot("NaN");
  } },
  overflow("eta-calculator"),

  // percentage-calculator
  { slug: "percentage-calculator", name: "it-tools e2e vectors and noise", async run(t) {
    await t.open();
    await setVal(t, "pct-percentage-x", 123);
    await setVal(t, "pct-percentage-y", 456);
    t.assert.equal(await val(t, "pct-percentage-result"), "560.88");
    await setVal(t, "pct-number-x", 123);
    await setVal(t, "pct-number-y", 456);
    t.assert.equal(await val(t, "pct-number-result"), "26.973684210526315");
    await setVal(t, "pct-number-from", 123);
    await setVal(t, "pct-number-to", 456);
    t.assert.equal(await val(t, "pct-change-result"), "270.7317073170732");
    await setVal(t, "pct-percentage-x", 7);
    await setVal(t, "pct-percentage-y", 100);
    t.assert.equal(await val(t, "pct-percentage-result"), "7");
    await setVal(t, "pct-number-x", 0.07);
    await setVal(t, "pct-number-y", 1);
    t.assert.equal(await val(t, "pct-number-result"), "7");
    await setVal(t, "pct-number-from", 3);
    await setVal(t, "pct-number-to", 3.3);
    t.assert.equal(await val(t, "pct-change-result"), "10");
    await setVal(t, "pct-number-from", -100);
    await setVal(t, "pct-number-to", -50);
    t.assert.equal(await val(t, "pct-change-result"), "50");
    await t.main().getByRole("button", { name: /copy/i }).first().click();
    t.assert.equal(await t.clipboard(), "7");
  } },
  { slug: "percentage-calculator", name: "incomplete, zero, cleared", async run(t) {
    await t.open();
    for (const id of ["pct-percentage-result", "pct-number-result", "pct-change-result"]) t.assert.equal(await val(t, id), "");
    await setVal(t, "pct-percentage-x", 123);
    t.assert.equal(await val(t, "pct-percentage-result"), "");
    await setVal(t, "pct-number-y", 456);
    t.assert.equal(await val(t, "pct-number-result"), "");
    await setVal(t, "pct-number-from", 123);
    t.assert.equal(await val(t, "pct-change-result"), "");
    await setVal(t, "pct-number-x", 5);
    await setVal(t, "pct-number-y", 0);
    t.assert.equal(await val(t, "pct-number-result"), "");
    await t.has("Y cannot be zero.");
    await setVal(t, "pct-number-from", 0);
    await setVal(t, "pct-number-to", 5);
    t.assert.equal(await val(t, "pct-change-result"), "");
    await t.has("From cannot be zero.");
    await setVal(t, "pct-number-y", 10);
    t.assert.equal(await val(t, "pct-number-result"), "50");
    await t.hasNot("Y cannot be zero.");
    await setVal(t, "pct-number-y", "");
    t.assert.equal(await val(t, "pct-number-result"), "", "stale result clears");
  } },
  overflow("percentage-calculator", async (t) => { await setVal(t, "pct-number-x", 123); await setVal(t, "pct-number-y", 456); }),

  // chronometer
  { slug: "chronometer", name: "start, stop, reset", async run(t) {
    await t.open();
    t.assert.ok((await tid(t, "chrono-duration")).includes("00:00.000"));
    await t.click("Start");
    await t.page.waitForTimeout(300);
    const a = await tid(t, "chrono-duration");
    t.assert.ok(!a.includes("00:00.000"), a);
    await t.click("Stop");
    const b = await tid(t, "chrono-duration");
    await t.page.waitForTimeout(200);
    t.assert.equal(await tid(t, "chrono-duration"), b, "does not move while stopped");
    await t.click("Start");
    await t.page.waitForTimeout(100);
    const resumed = await tid(t, "chrono-duration");
    t.assert.ok(resumed > b, `resumes from ${b}, got ${resumed}`);
    t.assert.ok(resumed.match(/00:0[01]\./), `no jump across the stopped time: ${resumed}`);
    await t.click("Reset");
    await t.page.waitForTimeout(150);
    const running = await tid(t, "chrono-duration");
    t.assert.ok(!running.includes("00:00.000") && running.match(/00:00\.[0-9]{3}/), `keeps running from zero: ${running}`);
    await t.click("Stop");
    await t.click("Reset");
    t.assert.ok((await tid(t, "chrono-duration")).includes("00:00.000"));
    await t.page.waitForTimeout(100);
    t.assert.ok((await tid(t, "chrono-duration")).includes("00:00.000"), "stays at zero");
  } },
  { slug: "chronometer", name: "keeps time when animation frames stop", async run(t) {
    await t.page.addInitScript(() => {
      const realNow = Date.now.bind(Date);
      const realRaf = window.requestAnimationFrame.bind(window);
      window.__offset = 0;
      window.__hidden = false;
      window.__pending = [];
      Date.now = () => realNow() + window.__offset;
      window.requestAnimationFrame = (cb) => { if (window.__hidden) { window.__pending.push(cb); return 0; } return realRaf(cb); };
      window.__wake = () => { window.__hidden = false; for (const cb of window.__pending.splice(0)) realRaf(cb); };
    });
    await t.open();
    await t.click("Start");
    await t.page.waitForTimeout(100);
    await t.page.evaluate(() => { window.__hidden = true; });
    await t.page.waitForTimeout(100);
    const frozen = await tid(t, "chrono-duration");
    await t.page.evaluate(() => { window.__offset += 3_725_000; });
    await t.page.waitForTimeout(50);
    t.assert.equal(await tid(t, "chrono-duration"), frozen, "no frames, no repaint");
    await t.page.evaluate(() => window.__wake());
    await t.page.waitForTimeout(100);
    const after = await tid(t, "chrono-duration");
    t.assert.ok(after.includes("01:02:05"), `caught up by 1h 2m 5s: ${after}`);
    // Stop with frames still suspended records the time since the last frame too.
    await t.page.evaluate(() => { window.__hidden = true; });
    await t.page.waitForTimeout(50);
    await t.page.evaluate(() => { window.__offset += 60_000; });
    await t.click("Stop");
    t.assert.ok((await tid(t, "chrono-duration")).includes("01:03:05"), await tid(t, "chrono-duration"));
  } },
  overflow("chronometer"),

  // temperature-converter
  { slug: "temperature-converter", name: "default and published points from every scale", async run(t) {
    await t.open();
    const scales = ["kelvin", "celsius", "fahrenheit", "rankine", "delisle", "newton", "reaumur", "romer"];
    const read = async () => Object.fromEntries(await Promise.all(scales.map(async (s) => [s, Number(await val(t, `temp-${s}`))])));
    t.assert.deepEqual(await read(), { kelvin: 0, celsius: -273.15, fahrenheit: -459.67, rankine: 0, delisle: 559.73, newton: -90.14, reaumur: -218.52, romer: -135.9 });
    const points = [
      { kelvin: 273.15, celsius: 0, fahrenheit: 32, rankine: 491.67, delisle: 150, newton: 0, reaumur: 0, romer: 7.5 },
      { kelvin: 373.15, celsius: 100, fahrenheit: 212, rankine: 671.67, delisle: 0, newton: 33, reaumur: 80, romer: 60 },
    ];
    for (const point of points) for (const s of scales) {
      await setVal(t, `temp-${s}`, point[s]);
      t.assert.deepEqual(await read(), point, `from ${s}`);
    }
    await setVal(t, "temp-celsius", 37);
    t.assert.deepEqual(await read(), { kelvin: 310.15, celsius: 37, fahrenheit: 98.6, rankine: 558.27, delisle: 94.5, newton: 12.21, reaumur: 29.6, romer: 26.93 });
  } },
  { slug: "temperature-converter", name: "typing keeps the source, clearing clears, below zero warns", async run(t) {
    await t.open();
    await t.page.locator("#temp-celsius").fill("");
    await t.page.locator("#temp-celsius").pressSequentially("-12.50");
    await t.page.waitForTimeout(80);
    t.assert.equal(await val(t, "temp-celsius"), "-12.50");
    t.assert.equal(await val(t, "temp-kelvin"), "260.65");
    t.assert.equal(await val(t, "temp-fahrenheit"), "9.5");
    await setVal(t, "temp-celsius", "");
    for (const s of ["kelvin", "fahrenheit", "romer"]) t.assert.equal(await val(t, `temp-${s}`), "", s);
    await t.hasNot("below absolute zero");
    await setVal(t, "temp-kelvin", -1);
    await t.has("below absolute zero");
    t.assert.equal(await val(t, "temp-celsius"), "-274.15");
    await setVal(t, "temp-fahrenheit", -459.67);
    await t.hasNot("below absolute zero");
    await setVal(t, "temp-kelvin", "1e308");
    await t.hasNot("NaN");
    t.assert.equal(await val(t, "temp-rankine"), "");
  } },
  overflow("temperature-converter"),

  // benchmark-builder
  { slug: "benchmark-builder", name: "defaults, unit, copy formats", async run(t) {
    await t.open();
    const rows = t.page.locator("[data-testid='bb-results-table'] tbody tr, table tbody tr");
    t.assert.equal(await rows.count(), 2);
    t.assert.deepEqual((await rows.nth(0).innerText()).split(/\t|\n/).map((s) => s.trim()).filter(Boolean), ["1", "Suite 1", "2", "7.5", "6.25"]);
    t.assert.deepEqual((await rows.nth(1).innerText()).split(/\t|\n/).map((s) => s.trim()).filter(Boolean), ["2", "Suite 2", "2", "10 (+2.5 ; x1.333)", "4"]);
    await t.fill("Unit", "ms");
    await t.has("10ms (+2.5ms ; x1.333)");
    await t.has("6.25ms²");
    await t.click("Copy as markdown table");
    t.assert.equal(await t.clipboard(), "| Position | Suite | Mean | Variance | Samples |\n| --- | --- | --- | --- | --- |\n| 1 | Suite 1 | 7.5ms | 6.25ms² | 2 |\n| 2 | Suite 2 | 10ms (+2.5ms ; x1.333) | 4ms² | 2 |");
    await t.click("Copy as bullet list");
    t.assert.equal(await t.clipboard(), " - Suite 1\n    - Position: 1\n    - Mean: 7.5ms\n    - Variance: 6.25ms²\n    - Samples: 2\n - Suite 2\n    - Position: 2\n    - Mean: 10ms (+2.5ms ; x1.333)\n    - Variance: 4ms²\n    - Samples: 2");
  } },
  { slug: "benchmark-builder", name: "editing measures, suites, reset", async run(t) {
    await t.open();
    const rows = t.page.locator("table tbody tr");
    await t.page.getByTestId("bb-suite-0-measure-0").fill("");
    await t.page.getByTestId("bb-suite-0-measure-0").pressSequentially("20.5");
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.page.getByTestId("bb-suite-0-measure-0").inputValue(), "20.5");
    t.assert.ok((await rows.nth(0).innerText()).includes("Suite 2"), "ranked by mean");
    await t.page.getByTestId("bb-suite-0-measure-1").press("Enter");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.page.evaluate(() => document.activeElement?.id), "bb-suite-0-measure-2", "Enter on the last measure adds and focuses a new one");
    await t.page.getByTestId("bb-suite-0-measure-0").press("Enter");
    await t.page.waitForTimeout(100);
    t.assert.equal(await t.page.evaluate(() => document.activeElement?.id), "bb-suite-0-measure-1", "Enter moves down");
    await t.main().getByRole("button", { name: "Delete measure 3" }).first().click();
    await t.page.getByTestId("bb-add-suite-1").click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.page.getByTestId("bb-suite-2-name").inputValue(), "Suite 3");
    t.assert.equal(await rows.count(), 3);
    t.assert.ok((await rows.nth(0).innerText()).includes("Suite 3"), "the new suite's single 0 measure is best");
    await t.has("x∞");
    await t.page.getByTestId("bb-delete-suite-2").click();
    await t.page.getByTestId("bb-delete-suite-1").click();
    await t.page.waitForTimeout(80);
    t.assert.equal(await t.page.getByTestId("bb-delete-suite-0").count(), 0, "the last suite cannot be deleted");
    await t.page.getByTestId("bb-suite-0-name").fill("a|b");
    await t.click("Copy as markdown table");
    t.assert.ok((await t.clipboard()).includes("| a\\|b |"));
    await t.click("Reset suites");
    await t.has("Suites reset.");
    t.assert.equal(await rows.count(), 2);
    t.assert.equal(await t.page.getByTestId("bb-suite-0-name").inputValue(), "Suite 1");
    t.assert.equal(await t.page.getByTestId("bb-suite-0-measure-0").count(), 0);
    await t.hasNot("NaN");
  } },
  { slug: "benchmark-builder", name: "suites and unit persist", async run(t) {
    await t.open();
    await t.page.getByTestId("bb-suite-0-name").fill("Fast path");
    await t.page.getByTestId("bb-suite-0-measure-0").fill("1");
    await t.fill("Unit", "ns");
    await t.page.waitForTimeout(100);
    await reload(t);
    t.assert.equal(await t.page.getByTestId("bb-suite-0-name").inputValue(), "Fast path");
    t.assert.equal(await t.page.getByTestId("bb-suite-0-measure-0").inputValue(), "1");
    t.assert.equal(await t.value("Unit"), "ns");
    await t.has("5.5ns");
    await t.page.evaluate(() => localStorage.setItem("benchmark-builder:suites", "{not json"));
    await reload(t);
    t.assert.equal(await t.page.getByTestId("bb-suite-0-name").inputValue(), "Suite 1", "corrupt storage falls back");
  } },
  overflow("benchmark-builder"),
  { slug: "benchmark-builder", name: "no overflow at 375 after edits", viewport: mobile, async run(t) {
    await t.open();
    await t.fill("Unit", "milliseconds");
    await t.page.getByTestId("bb-add-suite-0").click();
    await t.page.getByTestId("bb-add-measure-0").click();
    await t.page.getByTestId("bb-suite-0-name").fill("A very long suite name that keeps going and going and going without any end in sight");
    await t.page.getByTestId("bb-suite-0-measure-0").fill("123456789012345");
    await t.page.waitForTimeout(150);
    await t.noOverflow();
    await t.page.setViewportSize({ width: 320, height: 800 });
    await t.page.waitForTimeout(150);
    await t.noOverflow();
  } },
];
