declare module "pdf-signature-reader" {
  type VerifyPdfRawResult = {
    verified?: boolean;
    authenticity?: boolean;
    integrity?: boolean;
    expired?: boolean;
    signatures?: unknown[];
    message?: string;
    error?: unknown;
  };

  function verifyPDF(pdf: ArrayBuffer | Uint8Array): VerifyPdfRawResult;

  export function getCertificatesInfoFromPDF(pdf: ArrayBuffer | Uint8Array): unknown;

  export default verifyPDF;
}
