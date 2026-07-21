export type CaptureType = "image" | "video";

export interface CaptureFilenameOptions {
  type: CaptureType;
  createdAt: Date;
  mimeType?: string;
}

export interface CameraTransformOptions {
  mirrored: boolean;
  flipped: boolean;
}

export const CAMERA_RESOLUTIONS = [
  { value: "default", label: "Camera default", height: undefined },
  { value: "480p", label: "480p", height: 480 },
  { value: "720p", label: "720p HD", height: 720 },
  { value: "1080p", label: "1080p Full HD", height: 1080 },
  { value: "1440p", label: "1440p QHD", height: 1440 },
  { value: "2160p", label: "2160p 4K", height: 2160 },
] as const;

export type CameraResolutionId = (typeof CAMERA_RESOLUTIONS)[number]["value"];

export const CAMERA_ASPECT_RATIOS = [
  { value: "native", label: "Camera native", ratio: undefined },
  { value: "16:9", label: "16:9 widescreen", ratio: 16 / 9 },
  { value: "4:3", label: "4:3 standard", ratio: 4 / 3 },
  { value: "1:1", label: "1:1 square", ratio: 1 },
  { value: "9:16", label: "9:16 portrait", ratio: 9 / 16 },
] as const;

export type CameraAspectRatioId = (typeof CAMERA_ASPECT_RATIOS)[number]["value"];

export interface CameraVideoConstraintOptions {
  deviceId?: string;
  resolution: CameraResolutionId;
  aspectRatio: CameraAspectRatioId;
}

export function getCaptureFilename({ type, createdAt, mimeType }: CaptureFilenameOptions): string {
  const timestamp = formatTimestamp(createdAt);
  const extension = type === "image" ? "png" : extensionFromMimeType(mimeType || "video/webm");

  return `${type}-${timestamp}.${extension}`;
}

export function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("mp4")) {
    return "mp4";
  }

  if (mimeType.includes("ogg")) {
    return "ogv";
  }

  return "webm";
}

export function getDeviceLabel(kind: "Camera" | "Microphone", label: string, index: number): string {
  return label || `${kind} ${index + 1}`;
}

export function buildCameraVideoConstraints({
  deviceId,
  resolution,
  aspectRatio,
}: CameraVideoConstraintOptions): boolean | MediaTrackConstraints {
  const resolutionOption =
    CAMERA_RESOLUTIONS.find((option) => option.value === resolution) ?? CAMERA_RESOLUTIONS[0];
  const aspectRatioOption =
    CAMERA_ASPECT_RATIOS.find((option) => option.value === aspectRatio) ?? CAMERA_ASPECT_RATIOS[0];
  const constraints: MediaTrackConstraints = {};

  if (deviceId) {
    constraints.deviceId = { exact: deviceId };
  }

  if (resolutionOption.height) {
    constraints.height = { ideal: resolutionOption.height };

    if (aspectRatioOption.ratio) {
      constraints.width = { ideal: Math.round(resolutionOption.height * aspectRatioOption.ratio) };
    }
  }

  if (aspectRatioOption.ratio) {
    constraints.aspectRatio = { ideal: aspectRatioOption.ratio };
  }

  return Object.keys(constraints).length ? constraints : true;
}

export function getCameraTransform({ mirrored, flipped }: CameraTransformOptions): string {
  return `scaleX(${mirrored ? -1 : 1}) scaleY(${flipped ? -1 : 1})`;
}

export function getCameraOrientationLabel({ mirrored, flipped }: CameraTransformOptions): string {
  if (mirrored && flipped) {
    return "Mirrored + flipped";
  }

  if (mirrored) {
    return "Mirrored";
  }

  if (flipped) {
    return "Flipped";
  }

  return "Normal";
}

export function formatCaptureTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export function getPermissionErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError") {
      return "Permission was denied. Use the browser site-permissions menu to allow camera access.";
    }

    if (error.name === "NotFoundError") {
      return "No camera or microphone matching the selected options was found.";
    }
  }

  return error instanceof Error ? error.message : "The browser blocked camera access.";
}

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "-",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}
