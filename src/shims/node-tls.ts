/**
 * Browser/Worker stub for Node's `tls` module.
 * pdf-signature-reader reads `tls.rootCertificates` and falls back to its
 * bundled root CA list when this is undefined.
 */
export const rootCertificates: string[] | undefined = undefined;

export default { rootCertificates };
