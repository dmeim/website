import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ButtonGroup,
  Checkbox,
  ColorInput,
  CopyButton,
  Disclosure,
  EmptyState,
  Fieldset,
  FormGrid,
  Input,
  Notice,
  OutputField,
  Panel,
  Select,
  Textarea,
  ToolFrame,
} from "@/ui/react";
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
  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
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
  const [previewStatusType, setPreviewStatusType] = useState<
    "success" | "error" | ""
  >("");
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

  const updateContent = useCallback(
    <K extends keyof QrContentFormState>(
      key: K,
      value: QrContentFormState[K],
    ) => {
      setContent((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

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
        payloadResult.errors[0] ||
          "Complete the selected preset to generate a QR code.",
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
          error instanceof Error
            ? error.message
            : "Could not render this QR code.",
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

    downloadTextFile(
      `${exportBaseName}.svg`,
      qrSvg,
      "image/svg+xml;charset=utf-8",
    );
    setActionStatus("SVG download started.");
  }

  return (
    <ToolFrame>
      <ToolFrame layout="split">
        <Panel
          title="Content"
          titleId="qr-settings-heading"
          description="Choose a preset, fill in its fields, then audit the generated payload before exporting."
        >
          <Select
            label="QR type"
            id="qr-content-type"
            value={content.type}
            options={QR_CONTENT_TYPES.map((type) => ({
              value: type.value,
              label: type.label,
            }))}
            onChange={(event) =>
              updateContent("type", event.target.value as QrContentType)
            }
          />

          {content.type !== "text" && (
            <Fieldset legend="Preset options">
              {content.type === "website" && (
                <FormGrid columns={2}>
                  <Input
                    label="Website URL"
                    span="full"
                    id="qr-website-url"
                    type="text"
                    value={content.websiteUrl}
                    placeholder="https://example.com"
                    onChange={(event) =>
                      updateContent("websiteUrl", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "social" && (
                <FormGrid columns={2}>
                  <Select
                    label="Platform"
                    id="qr-social-platform"
                    value={content.socialPlatform}
                    onChange={(event) =>
                      updateContent(
                        "socialPlatform",
                        event.target
                          .value as QrContentFormState["socialPlatform"],
                      )
                    }
                  >
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Handle or full URL"
                    id="qr-social-value"
                    type="text"
                    value={content.socialValue}
                    placeholder="@username or https://..."
                    onChange={(event) =>
                      updateContent("socialValue", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "contact" && (
                <FormGrid columns={2}>
                  <Input
                    label="First name"
                    id="qr-contact-first-name"
                    type="text"
                    autoComplete="given-name"
                    value={content.contactFirstName}
                    onChange={(event) =>
                      updateContent("contactFirstName", event.target.value)
                    }
                  />
                  <Input
                    label="Last name"
                    id="qr-contact-last-name"
                    type="text"
                    autoComplete="family-name"
                    value={content.contactLastName}
                    onChange={(event) =>
                      updateContent("contactLastName", event.target.value)
                    }
                  />
                  <Input
                    label="Organization"
                    id="qr-contact-organization"
                    type="text"
                    autoComplete="organization"
                    value={content.contactOrganization}
                    onChange={(event) =>
                      updateContent("contactOrganization", event.target.value)
                    }
                  />
                  <Input
                    label="Title"
                    id="qr-contact-title"
                    type="text"
                    autoComplete="organization-title"
                    value={content.contactTitle}
                    onChange={(event) =>
                      updateContent("contactTitle", event.target.value)
                    }
                  />
                  <Input
                    label="Phone"
                    id="qr-contact-phone"
                    type="tel"
                    autoComplete="tel"
                    value={content.contactPhone}
                    onChange={(event) =>
                      updateContent("contactPhone", event.target.value)
                    }
                  />
                  <Input
                    label="Email"
                    id="qr-contact-email"
                    type="email"
                    autoComplete="email"
                    value={content.contactEmail}
                    onChange={(event) =>
                      updateContent("contactEmail", event.target.value)
                    }
                  />
                  <Input
                    label="Website"
                    span="full"
                    id="qr-contact-website"
                    type="text"
                    autoComplete="url"
                    placeholder="https://example.com"
                    value={content.contactWebsite}
                    onChange={(event) =>
                      updateContent("contactWebsite", event.target.value)
                    }
                  />
                  <Input
                    label="Address"
                    span="full"
                    id="qr-contact-address"
                    type="text"
                    autoComplete="street-address"
                    value={content.contactAddress}
                    onChange={(event) =>
                      updateContent("contactAddress", event.target.value)
                    }
                  />
                  <Textarea
                    label="Note"
                    span="full"
                    id="qr-contact-note"
                    rows={3}
                    value={content.contactNote}
                    onChange={(event) =>
                      updateContent("contactNote", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "wifi" && (
                <FormGrid columns={2}>
                  <Input
                    label="SSID / network name"
                    span="full"
                    id="qr-wifi-ssid"
                    type="text"
                    autoComplete="off"
                    placeholder="My WiFi Network"
                    value={content.wifiSsid}
                    onChange={(event) =>
                      updateContent("wifiSsid", event.target.value)
                    }
                  />
                  <Select
                    label="Encryption"
                    id="qr-wifi-encryption"
                    value={content.wifiEncryption}
                    onChange={(event) =>
                      updateContent(
                        "wifiEncryption",
                        event.target.value as WifiEncryption,
                      )
                    }
                  >
                    {WIFI_ENCRYPTIONS.map((method) => (
                      <option key={method} value={method}>
                        {WIFI_ENCRYPTION_LABELS[method]}
                      </option>
                    ))}
                  </Select>
                  <Checkbox
                    id="qr-wifi-hidden"
                    label="Hidden SSID"
                    checked={content.wifiHidden}
                    onChange={(event) =>
                      updateContent("wifiHidden", event.target.checked)
                    }
                  />
                  {content.wifiEncryption !== "nopass" && (
                    <Input
                      label="Password"
                      span="full"
                      id="qr-wifi-password"
                      type="password"
                      autoComplete="off"
                      value={content.wifiPassword}
                      onChange={(event) =>
                        updateContent("wifiPassword", event.target.value)
                      }
                    />
                  )}
                  {content.wifiEncryption === "WPA2-EAP" && (
                    <>
                      <Select
                        label="EAP method"
                        id="qr-wifi-eap-method"
                        value={content.wifiEapMethod}
                        onChange={(event) =>
                          updateContent(
                            "wifiEapMethod",
                            event.target
                              .value as QrContentFormState["wifiEapMethod"],
                          )
                        }
                      >
                        {EAP_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </Select>
                      <Select
                        label="Phase 2 method"
                        id="qr-wifi-eap-phase2"
                        value={content.wifiEapPhase2Method}
                        onChange={(event) =>
                          updateContent(
                            "wifiEapPhase2Method",
                            event.target
                              .value as QrContentFormState["wifiEapPhase2Method"],
                          )
                        }
                      >
                        {EAP_PHASE_2_METHODS.map((method) => (
                          <option key={method} value={method}>
                            {method}
                          </option>
                        ))}
                      </Select>
                      <Input
                        label="Identity"
                        id="qr-wifi-eap-identity"
                        type="text"
                        disabled={content.wifiEapAnonymousIdentity}
                        value={content.wifiEapIdentity}
                        onChange={(event) =>
                          updateContent("wifiEapIdentity", event.target.value)
                        }
                      />
                      <Checkbox
                        id="qr-wifi-eap-anonymous"
                        label="Use anonymous identity"
                        checked={content.wifiEapAnonymousIdentity}
                        onChange={(event) =>
                          updateContent(
                            "wifiEapAnonymousIdentity",
                            event.target.checked,
                          )
                        }
                      />
                    </>
                  )}
                </FormGrid>
              )}

              {content.type === "email" && (
                <FormGrid columns={2}>
                  <Input
                    label="Email address"
                    span="full"
                    id="qr-email-to"
                    type="email"
                    autoComplete="email"
                    placeholder="hello@example.com"
                    value={content.emailTo}
                    onChange={(event) =>
                      updateContent("emailTo", event.target.value)
                    }
                  />
                  <Input
                    label="Subject"
                    span="full"
                    id="qr-email-subject"
                    type="text"
                    value={content.emailSubject}
                    onChange={(event) =>
                      updateContent("emailSubject", event.target.value)
                    }
                  />
                  <Textarea
                    label="Body"
                    span="full"
                    id="qr-email-body"
                    rows={3}
                    value={content.emailBody}
                    onChange={(event) =>
                      updateContent("emailBody", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "phone" && (
                <FormGrid columns={2}>
                  <Input
                    label="Phone number"
                    span="full"
                    id="qr-phone-number"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 0100"
                    value={content.phoneNumber}
                    onChange={(event) =>
                      updateContent("phoneNumber", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "sms" && (
                <FormGrid columns={2}>
                  <Input
                    label="SMS number"
                    span="full"
                    id="qr-sms-number"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+1 555 0100"
                    value={content.smsNumber}
                    onChange={(event) =>
                      updateContent("smsNumber", event.target.value)
                    }
                  />
                  <Textarea
                    label="Message"
                    span="full"
                    id="qr-sms-message"
                    rows={3}
                    value={content.smsMessage}
                    onChange={(event) =>
                      updateContent("smsMessage", event.target.value)
                    }
                  />
                </FormGrid>
              )}

              {content.type === "location" && (
                <FormGrid columns={2}>
                  <Input
                    label="Latitude"
                    id="qr-location-latitude"
                    type="text"
                    placeholder="40.7128"
                    value={content.latitude}
                    onChange={(event) =>
                      updateContent("latitude", event.target.value)
                    }
                  />
                  <Input
                    label="Longitude"
                    id="qr-location-longitude"
                    type="text"
                    placeholder="-74.0060"
                    value={content.longitude}
                    onChange={(event) =>
                      updateContent("longitude", event.target.value)
                    }
                  />
                  <Input
                    label="Optional label"
                    span="full"
                    id="qr-location-label"
                    type="text"
                    placeholder="Office, meetup spot, etc."
                    value={content.locationLabel}
                    onChange={(event) =>
                      updateContent("locationLabel", event.target.value)
                    }
                  />
                </FormGrid>
              )}
            </Fieldset>
          )}

          {showPayloadAsGenerated ? (
            <OutputField
              id="qr-generated-payload"
              label="Generated QR payload"
              multiline
              rows={5}
              copy={false}
              value={payloadOutput}
            />
          ) : (
            <Textarea
              id="qr-text"
              label="Text"
              rows={5}
              placeholder="Any text to encode"
              value={content.text}
              onChange={(event) => updateContent("text", event.target.value)}
            />
          )}

          <Disclosure summary="Colors" level="inline">
            <FormGrid columns={2}>
              <ColorInput
                id="qr-foreground"
                label="Foreground color"
                value={foregroundColor}
                onChange={setForegroundColor}
              />
              <ColorInput
                id="qr-background"
                label="Background color"
                value={backgroundColor}
                disabled={transparentBackground}
                onChange={setBackgroundColor}
              />
              <Checkbox
                id="qr-transparent-background"
                label="Transparent background for exports"
                checked={transparentBackground}
                onChange={(event) =>
                  setTransparentBackground(event.target.checked)
                }
              />
            </FormGrid>
          </Disclosure>

          <Disclosure summary="Export options" level="inline">
            <FormGrid columns={2}>
              <Select
                id="qr-error-correction"
                label="Error resistance"
                span="full"
                value={errorCorrectionLevel}
                options={QR_ERROR_CORRECTION_LEVELS.map((level) => ({
                  value: level.value,
                  label: `${level.label} (${level.description})`,
                }))}
                onChange={(event) =>
                  setErrorCorrectionLevel(
                    event.target.value as QrErrorCorrectionLevel,
                  )
                }
              />
              <Input
                id="qr-margin"
                label="Quiet-zone margin"
                type="number"
                min={0}
                max={10}
                step={1}
                value={margin}
                onChange={(event) => setMargin(Number(event.target.value))}
              />
              <Input
                id="qr-size"
                label="PNG size"
                type="number"
                min={128}
                max={2048}
                step={64}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
              />
            </FormGrid>
          </Disclosure>

          <ButtonGroup>
            {payloadResult.isValid ? (
              <CopyButton value={payloadText} label="Copy payload" />
            ) : (
              <Button iconStart="copy" disabled>
                Copy payload
              </Button>
            )}
            {canExport ? (
              <CopyButton value={qrSvg} label="Copy SVG" />
            ) : (
              <Button iconStart="copy" disabled>
                Copy SVG
              </Button>
            )}
          </ButtonGroup>

          {actionStatus ? <Notice live="polite">{actionStatus}</Notice> : null}
        </Panel>

        <Panel
          className="qr-preview-panel"
          title="Preview & export"
          titleId="qr-preview-heading"
        >
          <Notice
            tone={
              previewStatusType === "error"
                ? "danger"
                : previewStatusType === "success"
                  ? "success"
                  : "neutral"
            }
            live="polite"
          >
            {previewStatus}
          </Notice>

          <div className="qr-preview">
            {qrPng ? (
              <img src={qrPng} alt="Generated QR code preview" />
            ) : (
              <EmptyState
                icon="image"
                size="sm"
                title="Your QR code will appear here."
              />
            )}
          </div>

          <ButtonGroup>
            <Button
              variant="primary"
              iconStart="download-simple"
              disabled={!canExport}
              onClick={downloadPng}
            >
              Download PNG
            </Button>
            <Button
              iconStart="download-simple"
              disabled={!canExport}
              onClick={downloadSvg}
            >
              Download SVG
            </Button>
          </ButtonGroup>
        </Panel>
      </ToolFrame>

      <Disclosure summary="SVG source">
        <OutputField
          label="Generated SVG markup"
          multiline
          rows={8}
          copy={Boolean(qrSvg)}
          value={qrSvg || "Generate a QR code to see SVG output."}
        />
      </Disclosure>
    </ToolFrame>
  );
}
