import { describe, expect, it } from "vitest";

import {
  buildCameraVideoConstraints,
  extensionFromMimeType,
  getCameraOrientationLabel,
  getCameraTransform,
  getCaptureFilename,
  getDeviceLabel,
  getPermissionErrorMessage,
} from "./cameraRecorder.service";

describe("cameraRecorder.service", () => {
  it("maps mime types to extensions", () => {
    expect(extensionFromMimeType("video/mp4")).toBe("mp4");
    expect(extensionFromMimeType("video/ogg")).toBe("ogv");
    expect(extensionFromMimeType("video/webm")).toBe("webm");
  });

  it("builds capture filenames", () => {
    const createdAt = new Date(2026, 0, 2, 3, 4, 5);
    expect(
      getCaptureFilename({ type: "image", createdAt, mimeType: "image/png" }),
    ).toMatch(/^image-20260102-030405\.png$/);
    expect(
      getCaptureFilename({ type: "video", createdAt, mimeType: "video/webm" }),
    ).toMatch(/^video-20260102-030405\.webm$/);
  });

  it("labels devices and orientation", () => {
    expect(getDeviceLabel("Camera", "", 0)).toBe("Camera 1");
    expect(getDeviceLabel("Microphone", "Built-in", 2)).toBe("Built-in");
    expect(getCameraOrientationLabel({ mirrored: true, flipped: true })).toBe(
      "Mirrored + flipped",
    );
    expect(getCameraTransform({ mirrored: true, flipped: false })).toBe(
      "scaleX(-1) scaleY(1)",
    );
  });

  it("builds ideal video constraints", () => {
    expect(
      buildCameraVideoConstraints({
        resolution: "default",
        aspectRatio: "native",
      }),
    ).toBe(true);

    const constraints = buildCameraVideoConstraints({
      deviceId: "cam-1",
      resolution: "720p",
      aspectRatio: "16:9",
    });

    expect(constraints).toMatchObject({
      deviceId: { exact: "cam-1" },
      height: { ideal: 720 },
      aspectRatio: { ideal: 16 / 9 },
    });
  });

  it("maps permission errors", () => {
    expect(getPermissionErrorMessage(new DOMException("denied", "NotAllowedError"))).toMatch(
      /Permission was denied/i,
    );
    expect(getPermissionErrorMessage(new Error("boom"))).toBe("boom");
  });
});
