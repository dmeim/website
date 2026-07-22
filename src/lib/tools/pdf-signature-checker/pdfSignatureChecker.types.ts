/** Certificate party (issuer or subject) fields from pdf-signature-reader. */
export interface CertificateParty {
  commonName: string;
  organizationName: string;
  organizationalUnitName?: string;
  countryName?: string;
  localityName?: string;
  stateOrProvinceName?: string;
  serialNumber?: string;
}

export interface CertificateValidityPeriod {
  notBefore: string;
  notAfter: string;
}

export interface SignatureCertificate {
  clientCertificate?: boolean;
  issuedBy: CertificateParty;
  issuedTo: CertificateParty;
  validityPeriod: CertificateValidityPeriod;
  pemCertificate: string;
}

export interface SignatureMeta {
  reason: string;
  contactInfo: string | null;
  location: string;
  name: string | null;
}

/** One digital signature extracted from a PDF. */
export interface SignatureInfo {
  verified: boolean;
  authenticity: boolean;
  integrity: boolean;
  expired: boolean;
  meta: {
    certs: SignatureCertificate[];
    signatureMeta: SignatureMeta;
  };
}

/** Soft-fail / success shape returned by `pdf-signature-reader`. */
export interface VerifyPdfRawResult {
  verified?: boolean;
  authenticity?: boolean;
  integrity?: boolean;
  expired?: boolean;
  signatures?: SignatureInfo[];
  message?: string;
  error?: unknown;
}

export type VerifyPdfFn = (pdf: ArrayBuffer | Uint8Array) => VerifyPdfRawResult;
