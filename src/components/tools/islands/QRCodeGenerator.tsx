import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { copyTextToClipboard } from "@/lib/tools/clipboard";
import { downloadDataUrl, downloadTextFile } from "@/lib/tools/download";
import {
  QR_ERROR_CORRECTION_LEVELS,
  type QrErrorCorrectionLevel,
  renderQrPngDataUrl,
  renderQrSvg,
} from "@/lib/tools/qr-code/qrCode.service";
import {
  QR_CONTENT_TYPES,
  SOCIAL_PLATFORMS,
  type QrContentFormState,
  type QrContentType,
  buildQrPayload,
  clampQrMargin,
  clampQrSize,
  createDefaultQrContentFormState,
  getQrBackgroundColor,
  getQrExportBaseName,
  isQrContentType,
} from "@/lib/tools/qr-code/qrCodeGenerator.service";
import {
  EAP_METHODS,
  EAP_PHASE_2_METHODS,
  WIFI_ENCRYPTIONS,
  type WifiEncryption,
} from "@/lib/tools/qr-code/wifiPayload.service";

import "./QRCodeGenerator.css";

const WIFI_ENCRYPTION_LABELS: Record<WifiEncryption, string> = {
  nopass: "No password",
  WPA: "WPA/WPA2 Personal",
  WEP: "WEP",
  "WPA2-EAP": "WPA2-EAP Enterprise",
};

function readTypeFromUrl(): QrContentType | null {
  if (typeof window === "undefined") {
    return null;
  }

  const type = new URLSearchParams(window.location.search).get("type");
  return type && isQrContentType(type) ? type : null;
}

function syncTypeToUrl(type: QrContentType) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  if (url.searchParams.get("type") === type) {
    return;
  }

  url.searchParams.set("type", type);
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export default function QRCodeGenerator() {
  const [content, setContent] = useState<QrContentFormState>(() =>
    createDefaultQrContentFormState({ type: readTypeFromUrl() ?? "text" }),
  );
  const [foregroundColor, setForegroundColor] = useState("#0c0e12");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [transparentBackground, setTransparentBackground] = useState(false);
  const [errorCorrectionLevel, setErrorCorrectionLevel] =
    useState<QrErrorCorrectionLevel>("M");
  const [size, setSize] = useState(768);
  const [margin, setMargin] = useState(2);
  const [qrPng, setQrPng] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [previewStatus, setPreviewStatus] = useState("");
  const [previewStatusType, setPreviewStatusType] = useState<"success" | "error" | "">("");
  const [actionStatus, setActionStatus] = useState("");
  const renderRequestRef = useRef(0);

  const payloadResult = useMemo(() => buildQrPayload(content), [content]);
  const payloadText = payloadResult.payload;
  const payloadOutput =
    payloadText ||
    payloadResult.errors.join("\n") ||
    "Complete the selected preset to generate QR content.";
  const normalizedSize = clampQrSize(size);
  const normalizedMargin = clampQrMargin(margin);
  const renderBackgroundColor = getQrBackgroundColor({
    backgroundColor,
    transparentBackground,
  });
  const canExport = Boolean(qrPng && qrSvg && payloadResult.isValid);
  const exportBaseName = getQrExportBaseName(payloadText);
  const showPayloadAsGenerated = content.type !== "text";

  const updateContent = useCallback(<K extends keyof QrContentFormState>(
    key: K,
    value: QrContentFormState[K],
  ) => {
    setContent((prev) => ({ ...prev, [key]: value }));
  }, []);

  useEffect(() => {
    syncTypeToUrl(content.type);
  }, [content.type]);

  useEffect(() => {
    const onPopState = () => {
      const type = readTypeFromUrl();
      if (type) {
        setContent((prev) => (prev.type === type ? prev : { ...prev, type }));
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    setActionStatus("");
    const requestId = ++renderRequestRef.current;

    if (!payloadResult.isValid) {
      setQrPng("");
      setQrSvg("");
      setPreviewStatus(
        payloadResult.errors[0] || "Complete the selected preset to generate a QR code.",
      );
      setPreviewStatusType(payloadResult.errors.length ? "error" : "");
      return;
    }

    setPreviewStatus("Rendering QR code…");
    setPreviewStatusType("");

    const options = {
      text: payloadText,
      foregroundColor,
      backgroundColor: renderBackgroundColor,
      errorCorrectionLevel,
      size: normalizedSize,
      margin: normalizedMargin,
    };

    void Promise.all([renderQrPngDataUrl(options), renderQrSvg(options)])
      .then(([png, svg]) => {
        if (requestId !== renderRequestRef.current) {
          return;
        }

        setQrPng(png);
        setQrSvg(svg);
        setPreviewStatus(
          `${payloadResult.label} QR code ready. All generation happens locally in your browser.`,
        );
        setPreviewStatusType("success");
      })
      .catch((error: unknown) => {
        if (requestId !== renderRequestRef.current) {
          return;
        }

        setQrPng("");
        setQrSvg("");
        setPreviewStatus(
          error instanceof Error ? error.message : "Could not render this QR code.",
        );
        setPreviewStatusType("error");
      });
  }, [
    payloadText,
    payloadResult.isValid,
    payloadResult.errors,
    payloadResult.label,
    foregroundColor,
    renderBackgroundColor,
    errorCorrectionLevel,
    normalizedSize,
    normalizedMargin,
  ]);

  async function copyWithStatus(value: string, successMessage: string) {
    try {
      await copyTextToClipboard(value);
      setActionStatus(successMessage);
    } catch {
      setActionStatus("Copy failed. Select the output and copy it manually.");
    }
  }

  async function copyPayload() {
    if (!payloadResult.isValid) {
      setActionStatus("No valid payload to copy yet.");
      return;
    }

    await copyWithStatus(payloadText, "Payload copied.");
  }

  async function copySvg() {
    if (!qrSvg) {
      setActionStatus("Nothing to copy yet.");
      return;
    }

    await copyWithStatus(qrSvg, "SVG copied.");
  }

  function downloadPng() {
    if (!qrPng) {
      return;
    }

    downloadDataUrl(`${exportBaseName}.png`, qrPng);
    setActionStatus("PNG download started.");
  }

  function downloadSvg() {
    if (!qrSvg) {
      return;
    }

    downloadTextFile(`${exportBaseName}.svg`, qrSvg, "image/svg+xml;charset=utf-8");
    setActionStatus("SVG download started.");
  }

  return (
    <div className="tool-island qr-island">
      <div className="tool-workspace">
        <section className="tool-panel" aria-labelledby="qr-settings-heading">
          <div className="tool-section-heading">
            <h2 id="qr-settings-heading">QR Content</h2>
            <p className="tool-hint">
              Choose a preset, fill in its fields, then audit the generated payload before
              exporting.
            </p>
          </div>

          <div className="tool-field tool-field--full">
            <label htmlFor="qr-content-type">QR type</label>
            <select
              id="qr-content-type"
              value={content.type}
              onChange={(event) => updateContent("type", event.target.value as QrContentType)}
            >
              {QR_CONTENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {content.type !== "text" && (
            <div className="tool-nested">
              <h3>Preset Options</h3>

              {content.type === "website" && (
                <div className="tool-form-grid">
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-website-url">Website URL</label>
                    <input
                      id="qr-website-url"
                      type="text"
                      value={content.websiteUrl}
                      placeholder="https://example.com"
                      onChange={(event) => updateContent("websiteUrl", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "social" && (
                <div className="tool-form-grid">
                  <div className="tool-field">
                    <label htmlFor="qr-social-platform">Platform</label>
                    <select
                      id="qr-social-platform"
                      value={content.socialPlatform}
                      onChange={(event) =>
                        updateContent(
                          "socialPlatform",
                          event.target.value as QrContentFormState["socialPlatform"],
                        )
                      }
                    >
                      {SOCIAL_PLATFORMS.map((platform) => (
                        <option key={platform.value} value={platform.value}>
                          {platform.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-social-value">Handle or full URL</label>
                    <input
                      id="qr-social-value"
                      type="text"
                      value={content.socialValue}
                      placeholder="@username or https://..."
                      onChange={(event) => updateContent("socialValue", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "contact" && (
                <div className="tool-form-grid">
                  <div className="tool-field">
                    <label htmlFor="qr-contact-first-name">First name</label>
                    <input
                      id="qr-contact-first-name"
                      type="text"
                      autoComplete="given-name"
                      value={content.contactFirstName}
                      onChange={(event) => updateContent("contactFirstName", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-contact-last-name">Last name</label>
                    <input
                      id="qr-contact-last-name"
                      type="text"
                      autoComplete="family-name"
                      value={content.contactLastName}
                      onChange={(event) => updateContent("contactLastName", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-contact-organization">Organization</label>
                    <input
                      id="qr-contact-organization"
                      type="text"
                      autoComplete="organization"
                      value={content.contactOrganization}
                      onChange={(event) =>
                        updateContent("contactOrganization", event.target.value)
                      }
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-contact-title">Title</label>
                    <input
                      id="qr-contact-title"
                      type="text"
                      autoComplete="organization-title"
                      value={content.contactTitle}
                      onChange={(event) => updateContent("contactTitle", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-contact-phone">Phone</label>
                    <input
                      id="qr-contact-phone"
                      type="tel"
                      autoComplete="tel"
                      value={content.contactPhone}
                      onChange={(event) => updateContent("contactPhone", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-contact-email">Email</label>
                    <input
                      id="qr-contact-email"
                      type="email"
                      autoComplete="email"
                      value={content.contactEmail}
                      onChange={(event) => updateContent("contactEmail", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-contact-website">Website</label>
                    <input
                      id="qr-contact-website"
                      type="text"
                      autoComplete="url"
                      placeholder="https://example.com"
                      value={content.contactWebsite}
                      onChange={(event) => updateContent("contactWebsite", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-contact-address">Address</label>
                    <input
                      id="qr-contact-address"
                      type="text"
                      autoComplete="street-address"
                      value={content.contactAddress}
                      onChange={(event) => updateContent("contactAddress", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-contact-note">Note</label>
                    <textarea
                      id="qr-contact-note"
                      rows={3}
                      value={content.contactNote}
                      onChange={(event) => updateContent("contactNote", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "wifi" && (
                <div className="tool-form-grid">
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-wifi-ssid">SSID / network name</label>
                    <input
                      id="qr-wifi-ssid"
                      type="text"
                      autoComplete="off"
                      placeholder="My WiFi Network"
                      value={content.wifiSsid}
                      onChange={(event) => updateContent("wifiSsid", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-wifi-encryption">Encryption</label>
                    <select
                      id="qr-wifi-encryption"
                      value={content.wifiEncryption}
                      onChange={(event) =>
                        updateContent("wifiEncryption", event.target.value as WifiEncryption)
                      }
                    >
                      {WIFI_ENCRYPTIONS.map((method) => (
                        <option key={method} value={method}>
                          {WIFI_ENCRYPTION_LABELS[method]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <label className="tool-check" htmlFor="qr-wifi-hidden">
                    <input
                      id="qr-wifi-hidden"
                      type="checkbox"
                      checked={content.wifiHidden}
                      onChange={(event) => updateContent("wifiHidden", event.target.checked)}
                    />
                    Hidden SSID
                  </label>
                  {content.wifiEncryption !== "nopass" && (
                    <div className="tool-field tool-field--full">
                      <label htmlFor="qr-wifi-password">Password</label>
                      <input
                        id="qr-wifi-password"
                        type="password"
                        autoComplete="off"
                        value={content.wifiPassword}
                        onChange={(event) => updateContent("wifiPassword", event.target.value)}
                      />
                    </div>
                  )}
                  {content.wifiEncryption === "WPA2-EAP" && (
                    <>
                      <div className="tool-field">
                        <label htmlFor="qr-wifi-eap-method">EAP method</label>
                        <select
                          id="qr-wifi-eap-method"
                          value={content.wifiEapMethod}
                          onChange={(event) =>
                            updateContent(
                              "wifiEapMethod",
                              event.target.value as QrContentFormState["wifiEapMethod"],
                            )
                          }
                        >
                          {EAP_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="tool-field">
                        <label htmlFor="qr-wifi-eap-phase2">Phase 2 method</label>
                        <select
                          id="qr-wifi-eap-phase2"
                          value={content.wifiEapPhase2Method}
                          onChange={(event) =>
                            updateContent(
                              "wifiEapPhase2Method",
                              event.target.value as QrContentFormState["wifiEapPhase2Method"],
                            )
                          }
                        >
                          {EAP_PHASE_2_METHODS.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="tool-field">
                        <label htmlFor="qr-wifi-eap-identity">Identity</label>
                        <input
                          id="qr-wifi-eap-identity"
                          type="text"
                          disabled={content.wifiEapAnonymousIdentity}
                          value={content.wifiEapIdentity}
                          onChange={(event) =>
                            updateContent("wifiEapIdentity", event.target.value)
                          }
                        />
                      </div>
                      <label className="tool-check" htmlFor="qr-wifi-eap-anonymous">
                        <input
                          id="qr-wifi-eap-anonymous"
                          type="checkbox"
                          checked={content.wifiEapAnonymousIdentity}
                          onChange={(event) =>
                            updateContent("wifiEapAnonymousIdentity", event.target.checked)
                          }
                        />
                        Use anonymous identity
                      </label>
                    </>
                  )}
                </div>
              )}

              {content.type === "email" && (
                <div className="tool-form-grid">
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-email-to">Email address</label>
                    <input
                      id="qr-email-to"
                      type="email"
                      autoComplete="email"
                      placeholder="hello@example.com"
                      value={content.emailTo}
                      onChange={(event) => updateContent("emailTo", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-email-subject">Subject</label>
                    <input
                      id="qr-email-subject"
                      type="text"
                      value={content.emailSubject}
                      onChange={(event) => updateContent("emailSubject", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-email-body">Body</label>
                    <textarea
                      id="qr-email-body"
                      rows={3}
                      value={content.emailBody}
                      onChange={(event) => updateContent("emailBody", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "phone" && (
                <div className="tool-form-grid">
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-phone-number">Phone number</label>
                    <input
                      id="qr-phone-number"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 555 0100"
                      value={content.phoneNumber}
                      onChange={(event) => updateContent("phoneNumber", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "sms" && (
                <div className="tool-form-grid">
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-sms-number">SMS number</label>
                    <input
                      id="qr-sms-number"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+1 555 0100"
                      value={content.smsNumber}
                      onChange={(event) => updateContent("smsNumber", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-sms-message">Message</label>
                    <textarea
                      id="qr-sms-message"
                      rows={3}
                      value={content.smsMessage}
                      onChange={(event) => updateContent("smsMessage", event.target.value)}
                    />
                  </div>
                </div>
              )}

              {content.type === "location" && (
                <div className="tool-form-grid">
                  <div className="tool-field">
                    <label htmlFor="qr-location-latitude">Latitude</label>
                    <input
                      id="qr-location-latitude"
                      type="text"
                      placeholder="40.7128"
                      value={content.latitude}
                      onChange={(event) => updateContent("latitude", event.target.value)}
                    />
                  </div>
                  <div className="tool-field">
                    <label htmlFor="qr-location-longitude">Longitude</label>
                    <input
                      id="qr-location-longitude"
                      type="text"
                      placeholder="-74.0060"
                      value={content.longitude}
                      onChange={(event) => updateContent("longitude", event.target.value)}
                    />
                  </div>
                  <div className="tool-field tool-field--full">
                    <label htmlFor="qr-location-label">Optional label</label>
                    <input
                      id="qr-location-label"
                      type="text"
                      placeholder="Office, meetup spot, etc."
                      value={content.locationLabel}
                      onChange={(event) => updateContent("locationLabel", event.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="tool-field tool-field--full">
            <label htmlFor={showPayloadAsGenerated ? "qr-generated-payload" : "qr-text"}>
              {showPayloadAsGenerated ? "Generated QR payload" : "Text"}
            </label>
            {showPayloadAsGenerated ? (
              <textarea
                id="qr-generated-payload"
                className="tool-code"
                readOnly
                rows={5}
                value={payloadOutput}
              />
            ) : (
              <textarea
                id="qr-text"
                rows={5}
                placeholder="Any text to encode"
                value={content.text}
                onChange={(event) => updateContent("text", event.target.value)}
              />
            )}
          </div>

          <div className="tool-nested">
            <h3>Colors</h3>
            <div className="tool-form-grid">
              <div className="tool-field">
                <label htmlFor="qr-foreground">Foreground color</label>
                <input
                  id="qr-foreground"
                  type="color"
                  value={foregroundColor}
                  onChange={(event) => setForegroundColor(event.target.value)}
                />
              </div>
              <div className="tool-field">
                <label htmlFor="qr-background">Background color</label>
                <input
                  id="qr-background"
                  type="color"
                  value={backgroundColor}
                  disabled={transparentBackground}
                  onChange={(event) => setBackgroundColor(event.target.value)}
                />
              </div>
              <label className="tool-check tool-check--full" htmlFor="qr-transparent-background">
                <input
                  id="qr-transparent-background"
                  type="checkbox"
                  checked={transparentBackground}
                  onChange={(event) => setTransparentBackground(event.target.checked)}
                />
                Transparent background for exports
              </label>
            </div>
          </div>

          <div className="tool-nested">
            <h3>Export Options</h3>
            <div className="tool-form-grid tool-form-grid--export">
              <div className="tool-field">
                <label htmlFor="qr-error-correction">Error resistance</label>
                <select
                  id="qr-error-correction"
                  value={errorCorrectionLevel}
                  onChange={(event) =>
                    setErrorCorrectionLevel(event.target.value as QrErrorCorrectionLevel)
                  }
                >
                  {QR_ERROR_CORRECTION_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label} — {level.description}
                    </option>
                  ))}
                </select>
              </div>
              <div className="tool-field">
                <label htmlFor="qr-margin">Quiet-zone margin</label>
                <input
                  id="qr-margin"
                  type="number"
                  min={0}
                  max={10}
                  step={1}
                  value={margin}
                  onChange={(event) => setMargin(Number(event.target.value))}
                />
              </div>
              <div className="tool-field">
                <label htmlFor="qr-size">PNG size</label>
                <input
                  id="qr-size"
                  type="number"
                  min={128}
                  max={2048}
                  step={64}
                  value={size}
                  onChange={(event) => setSize(Number(event.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="tool-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!payloadResult.isValid}
              onClick={() => void copyPayload()}
            >
              Copy payload
            </button>
            <button
              type="button"
              className="btn"
              disabled={!canExport}
              onClick={() => void copySvg()}
            >
              Copy SVG
            </button>
          </div>

          {actionStatus && (
            <p className="tool-status" aria-live="polite">
              {actionStatus}
            </p>
          )}
        </section>

        <section className="tool-panel" aria-labelledby="qr-preview-heading">
          <div className="tool-section-heading">
            <h2 id="qr-preview-heading">Preview &amp; Export</h2>
            <p
              className={`tool-status${previewStatusType ? ` tool-status--${previewStatusType}` : ""}`}
              aria-live="polite"
            >
              {previewStatus}
            </p>
          </div>

          <div className="qr-preview">
            {qrPng ? (
              <img src={qrPng} alt="Generated QR code preview" />
            ) : (
              <p className="tool-empty">Your QR code will appear here.</p>
            )}
          </div>

          <div className="tool-actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canExport}
              onClick={downloadPng}
            >
              Download PNG
            </button>
            <button type="button" className="btn" disabled={!canExport} onClick={downloadSvg}>
              Download SVG
            </button>
          </div>
        </section>
      </div>

      <section className="tool-panel" aria-labelledby="qr-svg-heading">
        <div className="tool-section-heading">
          <h2 id="qr-svg-heading">SVG Output</h2>
          <p className="tool-hint">Useful for auditing, embedding, or copying into design files.</p>
        </div>
        <textarea
          className="tool-code"
          readOnly
          rows={8}
          value={qrSvg || "Generate a QR code to see SVG output."}
          aria-label="Generated SVG markup"
        />
      </section>
    </div>
  );
}
