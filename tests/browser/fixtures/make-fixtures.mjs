// Rebuilds the PDF fixtures with a real detached CMS signature from openssl, using no tool code.
// The signing key is throwaway and is deleted afterward, so only the public certificate is kept.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = fileURLToPath(new URL("./", import.meta.url));
const SIGNATURE_HEX_LENGTH = 8192;

const openssl = (...args) => execFileSync("openssl", args, { stdio: "ignore" });
const fixture = (name) => path.join(HERE, name);
const padded = (value) => String(value).padEnd(10, " ");

const work = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-fixtures-"));
const key = path.join(work, "key.pem");
const toBeSigned = path.join(work, "tbs.bin");
const signature = path.join(work, "sig.der");

try {
  openssl("req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", key, "-out", fixture("cert.pem"), "-days", "3650", "-subj", "/C=US/O=Audit Org/CN=Audit Signer", "-sha256");

  const template = (first, second, third) => `%PDF-1.4
1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj
2 0 obj <</Type/Pages/Kids[3 0 R]/Count 1>> endobj
3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>> endobj
4 0 obj <</Type/Sig/Filter/Adobe.PPKLite/SubFilter/adbe.pkcs7.detached/Reason(Audit test)/Location(Philadelphia)/ByteRange[0 ${first} ${second} ${third}]/Contents <`;
  const tail = `>>> endobj
trailer <</Root 1 0 R>>
%%EOF
`;

  // The byte range numbers are fixed width, so filling them in does not move any offsets.
  const beforeSignature = template(padded(0), padded(0), padded(0)).length - 1;
  const afterSignature = beforeSignature + 1 + SIGNATURE_HEX_LENGTH + 1;
  const head = template(padded(beforeSignature), padded(afterSignature), padded(tail.length));
  const after = Buffer.from(tail, "latin1");
  const withContents = (hex) => Buffer.concat([Buffer.from(head, "latin1"), Buffer.from(hex, "latin1"), Buffer.from(">", "latin1"), after]);

  fs.writeFileSync(toBeSigned, Buffer.concat([Buffer.from(head.slice(0, beforeSignature), "latin1"), after]));
  openssl("cms", "-sign", "-binary", "-in", toBeSigned, "-signer", fixture("cert.pem"), "-inkey", key, "-outform", "DER", "-out", signature, "-md", "sha256");
  const signatureHex = fs.readFileSync(signature).toString("hex");
  if (signatureHex.length > SIGNATURE_HEX_LENGTH) throw new Error("Signature is larger than its placeholder.");

  const signed = withContents(signatureHex.padEnd(SIGNATURE_HEX_LENGTH, "0"));
  fs.writeFileSync(fixture("signed.pdf"), signed);
  fs.writeFileSync(fixture("unsigned.pdf"), "%PDF-1.4\n1 0 obj <</Type/Catalog>> endobj\ntrailer <</Root 1 0 R>>\n%%EOF\n");
  fs.writeFileSync(fixture("garbage.pdf"), "this is not a pdf at all");
  // Signed in form, but the signature contents are junk.
  fs.writeFileSync(fixture("corrupt.pdf"), withContents("ab".repeat(SIGNATURE_HEX_LENGTH / 2)));
  fs.writeFileSync(fixture("unsupported.pdf"), signed.toString("latin1").replace("adbe.pkcs7.detached", "adbe.x509.rsa_sha1"), "latin1");
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
