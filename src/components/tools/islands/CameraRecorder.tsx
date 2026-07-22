import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ToolActionRow,
  ToolButton,
  ToolCheck,
  ToolEmpty,
  ToolFormGrid,
  ToolHint,
  ToolIsland,
  ToolPanel,
  ToolSectionHeading,
  ToolStatus,
  ToolWorkspace,
} from "@/components/tools/ui";
import { downloadUrl } from "@/lib/tools/download";
import {
  CAMERA_ASPECT_RATIOS,
  CAMERA_RESOLUTIONS,
  type CameraAspectRatioId,
  type CameraResolutionId,
  type CaptureType,
  buildCameraVideoConstraints,
  formatCaptureTime,
  getCameraOrientationLabel,
  getCameraTransform,
  getCaptureFilename,
  getDeviceLabel,
  getPermissionErrorMessage,
} from "@/lib/tools/camera-recorder/cameraRecorder.service";
import { useMediaRecorder } from "@/lib/tools/camera-recorder/useMediaRecorder";

import "./CameraRecorder.css";

interface CaptureItem {
  id: string;
  type: CaptureType;
  url: string;
  createdAt: Date;
  mimeType: string;
  filename: string;
  revokeOnDelete: boolean;
}

function createCaptureId(createdAt: Date): string {
  return crypto.randomUUID?.() ?? `${createdAt.getTime()}-${Math.random()}`;
}

export default function CameraRecorder() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordingAnimationFrameRef = useRef(0);
  const transformedRecordingVideoTrackRef = useRef<MediaStreamTrack | null>(null);
  const pendingStartRecordingRef = useRef(false);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [selectedResolution, setSelectedResolution] = useState<CameraResolutionId>("default");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<CameraAspectRatioId>("native");
  const [includeAudio, setIncludeAudio] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [captures, setCaptures] = useState<CaptureItem[]>([]);
  const [statusMessage, setStatusMessage] = useState(
    "Camera is off. Start it when you are ready to grant permission.",
  );
  const [statusType, setStatusType] = useState<"success" | "error" | "">("");
  const [permissionError, setPermissionError] = useState("");

  const isSupported =
    typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
  const needsSecureContext = typeof window !== "undefined" && !window.isSecureContext;
  const isCameraOn = Boolean(stream);
  const hasMicrophones = microphones.length > 0;
  const hasCameraTransform = isMirrored || isFlipped;
  const cameraTransform = getCameraTransform({ mirrored: isMirrored, flipped: isFlipped });
  const cameraOrientationLabel = getCameraOrientationLabel({
    mirrored: isMirrored,
    flipped: isFlipped,
  });

  const addCapture = useCallback(
    ({
      type,
      url,
      mimeType,
      revokeOnDelete,
    }: Pick<CaptureItem, "type" | "url" | "mimeType" | "revokeOnDelete">) => {
      const createdAt = new Date();
      setCaptures((prev) => [
        {
          id: createCaptureId(createdAt),
          type,
          url,
          createdAt,
          mimeType,
          filename: getCaptureFilename({ type, createdAt, mimeType }),
          revokeOnDelete,
        },
        ...prev,
      ]);
    },
    [],
  );

  const cleanupRecordingStream = useCallback(() => {
    if (recordingAnimationFrameRef.current) {
      window.cancelAnimationFrame(recordingAnimationFrameRef.current);
      recordingAnimationFrameRef.current = 0;
    }

    transformedRecordingVideoTrackRef.current?.stop();
    transformedRecordingVideoTrackRef.current = null;
    setRecordingStream(null);
  }, []);

  const handleRecordingAvailable = useCallback(
    ({ url, mimeType }: { url: string; mimeType: string }) => {
      addCapture({ type: "video", url, mimeType, revokeOnDelete: true });
      cleanupRecordingStream();
      setStatusMessage("Video recording saved locally in the gallery.");
      setStatusType("success");
    },
    [addCapture, cleanupRecordingStream],
  );

  const {
    isRecordingSupported,
    pauseRecording,
    recordingState,
    resumeRecording,
    startRecording,
    stopRecording,
  } = useMediaRecorder(recordingStream, handleRecordingAvailable);

  const revokeCaptureUrl = useCallback((capture: CaptureItem) => {
    if (capture.revokeOnDelete) {
      URL.revokeObjectURL(capture.url);
    }
  }, []);

  const stopCamera = useCallback(
    (options: { silent?: boolean } = {}) => {
      if (recordingState !== "inactive") {
        stopRecording();
      }

      stream?.getTracks().forEach((track) => track.stop());
      setStream(null);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      if (!options.silent) {
        setStatusMessage("Camera stopped.");
        setStatusType("");
      }
    },
    [recordingState, stopRecording, stream],
  );

  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const nextCameras = devices.filter((device) => device.kind === "videoinput");
    const nextMicrophones = devices.filter((device) => device.kind === "audioinput");

    setCameras(nextCameras);
    setMicrophones(nextMicrophones);

    setSelectedCameraId((current) =>
      current && nextCameras.some((device) => device.deviceId === current)
        ? current
        : (nextCameras[0]?.deviceId ?? ""),
    );
    setSelectedMicrophoneId((current) =>
      current && nextMicrophones.some((device) => device.deviceId === current)
        ? current
        : (nextMicrophones[0]?.deviceId ?? ""),
    );
  }, []);

  const buildConstraints = useCallback((): MediaStreamConstraints => {
    const videoConstraint = buildCameraVideoConstraints({
      deviceId: selectedCameraId,
      resolution: selectedResolution,
      aspectRatio: selectedAspectRatio,
    });

    const audioConstraint: boolean | MediaTrackConstraints = includeAudio
      ? selectedMicrophoneId
        ? { deviceId: { exact: selectedMicrophoneId } }
        : true
      : false;

    return {
      audio: audioConstraint,
      video: videoConstraint,
    };
  }, [
    includeAudio,
    selectedAspectRatio,
    selectedCameraId,
    selectedMicrophoneId,
    selectedResolution,
  ]);

  const syncSelectedDevicesFromStream = useCallback((mediaStream: MediaStream) => {
    const videoTrack = mediaStream.getVideoTracks()[0];
    const audioTrack = mediaStream.getAudioTracks()[0];
    const videoDeviceId = videoTrack?.getSettings().deviceId;
    const audioDeviceId = audioTrack?.getSettings().deviceId;

    if (videoDeviceId) {
      setSelectedCameraId(videoDeviceId);
    }

    if (audioDeviceId) {
      setSelectedMicrophoneId(audioDeviceId);
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!isSupported) {
      setPermissionError("This browser does not support camera capture.");
      setStatusType("error");
      return;
    }

    setPermissionError("");
    setStatusMessage("Requesting camera permission…");
    setStatusType("");
    stopCamera({ silent: true });

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(buildConstraints());
      setStream(mediaStream);
      setStatusMessage("Camera is active. Captures stay local until you download them.");
      setStatusType("success");
      await refreshDevices();
      syncSelectedDevicesFromStream(mediaStream);
    } catch (error) {
      setStream(null);
      setPermissionError(getPermissionErrorMessage(error));
      setStatusMessage("Camera could not be started.");
      setStatusType("error");
    }
  }, [
    buildConstraints,
    isSupported,
    refreshDevices,
    stopCamera,
    syncSelectedDevicesFromStream,
  ]);

  const drawVideoFrameToCanvas = useCallback(
    (canvas: HTMLCanvasElement, width: number, height: number): boolean => {
      if (!videoRef.current) {
        return false;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return false;
      }

      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(isMirrored ? width : 0, isFlipped ? height : 0);
      context.scale(isMirrored ? -1 : 1, isFlipped ? -1 : 1);
      context.drawImage(videoRef.current, 0, 0, width, height);
      context.restore();

      return true;
    },
    [isFlipped, isMirrored],
  );

  const prepareRecordingStream = useCallback((): boolean => {
    cleanupRecordingStream();

    if (!videoRef.current || !stream) {
      setRecordingStream(stream);
      return Boolean(stream);
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    if (!width || !height) {
      setStatusMessage("Video is not ready yet. Try again in a moment.");
      setStatusType("error");
      return false;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    if (typeof canvas.captureStream !== "function") {
      setRecordingStream(stream);

      if (hasCameraTransform) {
        setStatusMessage(
          "This browser records the raw camera feed, but mirror/flip still affects preview and photos.",
        );
        setStatusType("");
      }

      return true;
    }

    const drawFrame = () => {
      drawVideoFrameToCanvas(canvas, width, height);
      recordingAnimationFrameRef.current = window.requestAnimationFrame(drawFrame);
    };

    drawFrame();
    const canvasStream = canvas.captureStream(30);
    transformedRecordingVideoTrackRef.current = canvasStream.getVideoTracks()[0] ?? null;
    setRecordingStream(
      new MediaStream([...canvasStream.getVideoTracks(), ...stream.getAudioTracks()]),
    );

    return true;
  }, [
    cleanupRecordingStream,
    drawVideoFrameToCanvas,
    hasCameraTransform,
    stream,
  ]);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !stream) {
      setStatusMessage("Start the camera before taking a photo.");
      setStatusType("error");
      return;
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;

    if (!width || !height) {
      setStatusMessage("Video is not ready yet. Try again in a moment.");
      setStatusType("error");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    if (!drawVideoFrameToCanvas(canvas, width, height)) {
      setStatusMessage("Could not draw the current video frame.");
      setStatusType("error");
      return;
    }

    const url = canvas.toDataURL("image/png");
    addCapture({ type: "image", url, mimeType: "image/png", revokeOnDelete: false });
    setStatusMessage("Photo saved locally in the gallery.");
    setStatusType("success");
  }, [addCapture, drawVideoFrameToCanvas, stream]);

  const startVideoRecording = useCallback(() => {
    if (!stream) {
      setStatusMessage("Start the camera before recording video.");
      setStatusType("error");
      return;
    }

    if (!prepareRecordingStream()) {
      return;
    }

    // Defer start until recordingStream state commits via effect below.
    pendingStartRecordingRef.current = true;
  }, [prepareRecordingStream, stream]);

  useEffect(() => {
    if (pendingStartRecordingRef.current && recordingStream) {
      pendingStartRecordingRef.current = false;
      startRecording();
    }
  }, [recordingStream, startRecording]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    void refreshDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshDevices);

    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", refreshDevices);
      cleanupRecordingStream();
    };
  }, [cleanupRecordingStream, refreshDevices]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  const capturesRef = useRef(captures);
  capturesRef.current = captures;

  useEffect(() => {
    return () => {
      capturesRef.current.forEach((capture) => {
        if (capture.revokeOnDelete) {
          URL.revokeObjectURL(capture.url);
        }
      });
    };
  }, []);

  const galleryHint = useMemo(() => {
    if (!captures.length) {
      return "Photos and videos will appear here after capture.";
    }

    return `${captures.length} local capture${captures.length === 1 ? "" : "s"}.`;
  }, [captures.length]);

  function downloadCapture(capture: CaptureItem) {
    downloadUrl(capture.filename, capture.url);
  }

  function deleteCapture(capture: CaptureItem) {
    revokeCaptureUrl(capture);
    setCaptures((prev) => prev.filter((item) => item.id !== capture.id));
  }

  function clearCaptures() {
    setCaptures((prev) => {
      prev.forEach(revokeCaptureUrl);
      return [];
    });
  }

  if (!isSupported) {
    return (
      <ToolIsland className="camera-island" animate={false}>
        <ToolPanel animate={false} aria-live="polite">
          <ToolSectionHeading title="Camera capture is unavailable" />
          <ToolStatus tone="error">
            Your browser does not expose the camera APIs needed for this tool.
          </ToolStatus>
        </ToolPanel>
      </ToolIsland>
    );
  }

  if (needsSecureContext) {
    return (
      <ToolIsland className="camera-island" animate={false}>
        <ToolPanel animate={false} aria-live="polite">
          <ToolSectionHeading title="Secure context required" />
          <ToolStatus tone="error">
            Camera APIs require HTTPS or localhost. Open this page over a secure origin.
          </ToolStatus>
        </ToolPanel>
      </ToolIsland>
    );
  }

  return (
    <ToolIsland className="camera-island">
      <ToolWorkspace>
        <ToolPanel labelledBy="camera-settings-heading">
          <ToolSectionHeading
            title="Camera Controls"
            titleId="camera-settings-heading"
            description={
              <ToolStatus tone={statusType || "default"}>{statusMessage}</ToolStatus>
            }
          />

          {permissionError ? <ToolStatus tone="error">{permissionError}</ToolStatus> : null}

          <ToolFormGrid>
            <div className="tool-field tool-field--full">
              <label htmlFor="camera-device">Video input</label>
              <select
                id="camera-device"
                value={selectedCameraId}
                onChange={(event) => setSelectedCameraId(event.target.value)}
              >
                {!cameras.length && <option value="">Default camera</option>}
                {cameras.map((camera, index) => (
                  <option key={camera.deviceId || index} value={camera.deviceId}>
                    {getDeviceLabel("Camera", camera.label, index)}
                  </option>
                ))}
              </select>
            </div>

            <div className="tool-field">
              <label htmlFor="camera-resolution">Resolution</label>
              <select
                id="camera-resolution"
                value={selectedResolution}
                onChange={(event) =>
                  setSelectedResolution(event.target.value as CameraResolutionId)
                }
              >
                {CAMERA_RESOLUTIONS.map((resolution) => (
                  <option key={resolution.value} value={resolution.value}>
                    {resolution.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="tool-field">
              <label htmlFor="camera-aspect-ratio">Aspect ratio</label>
              <select
                id="camera-aspect-ratio"
                value={selectedAspectRatio}
                onChange={(event) =>
                  setSelectedAspectRatio(event.target.value as CameraAspectRatioId)
                }
              >
                {CAMERA_ASPECT_RATIOS.map((aspectRatio) => (
                  <option key={aspectRatio.value} value={aspectRatio.value}>
                    {aspectRatio.label}
                  </option>
                ))}
              </select>
            </div>

            <ToolCheck
              id="camera-include-audio"
              full
              label="Include microphone audio in videos"
              checked={includeAudio}
              onChange={(event) => setIncludeAudio(event.target.checked)}
            />

            {includeAudio && (
              <div className="tool-field tool-field--full">
                <label htmlFor="camera-microphone">Audio input</label>
                <select
                  id="camera-microphone"
                  value={selectedMicrophoneId}
                  disabled={!hasMicrophones}
                  onChange={(event) => setSelectedMicrophoneId(event.target.value)}
                >
                  {!hasMicrophones && <option value="">Default microphone</option>}
                  {microphones.map((microphone, index) => (
                    <option key={microphone.deviceId || index} value={microphone.deviceId}>
                      {getDeviceLabel("Microphone", microphone.label, index)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </ToolFormGrid>

          <ToolActionRow>
            {!isCameraOn ? (
              <ToolButton variant="primary" onClick={() => void startCamera()}>
                Start camera
              </ToolButton>
            ) : (
              <ToolButton onClick={() => void startCamera()}>Apply settings</ToolButton>
            )}
            <ToolButton variant="ghost" onClick={() => void refreshDevices()}>
              Refresh devices
            </ToolButton>
            {isCameraOn ? (
              <ToolButton variant="danger" onClick={() => stopCamera()}>
                Stop camera
              </ToolButton>
            ) : null}
          </ToolActionRow>

          <ToolHint>
            Device labels usually appear after permission is granted. Resolution and aspect ratio
            are best-effort browser constraints; use Apply settings after changing them while the
            camera is on.
          </ToolHint>
        </ToolPanel>

        <ToolPanel labelledBy="camera-preview-heading">
          <ToolSectionHeading
            title="Live Preview"
            titleId="camera-preview-heading"
            description={
              <ToolHint>Use the controls below the preview to capture photos or videos.</ToolHint>
            }
          />

          <div className="camera-preview-frame">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              hidden={!isCameraOn}
              style={{ transform: cameraTransform }}
            />
            {!isCameraOn ? (
              <ToolEmpty>Start the camera to see a live preview.</ToolEmpty>
            ) : null}
          </div>

          <div className="camera-control-bar">
            <div className="camera-capture-controls">
              <ToolButton variant="primary" disabled={!isCameraOn} onClick={takePhoto}>
                Take photo
              </ToolButton>

              {isRecordingSupported ? (
                <>
                  {recordingState === "inactive" ? (
                    <ToolButton disabled={!isCameraOn} onClick={startVideoRecording}>
                      Start recording
                    </ToolButton>
                  ) : null}
                  {recordingState === "recording" ? (
                    <ToolButton onClick={pauseRecording}>Pause</ToolButton>
                  ) : null}
                  {recordingState === "paused" ? (
                    <ToolButton onClick={resumeRecording}>Resume</ToolButton>
                  ) : null}
                  {recordingState !== "inactive" ? (
                    <ToolButton variant="danger" onClick={stopRecording}>
                      Stop recording
                    </ToolButton>
                  ) : null}
                </>
              ) : (
                <ToolStatus tone="error">Video recording is not supported in this browser.</ToolStatus>
              )}
            </div>

            <div
              className="camera-orientation-controls"
              aria-label={`Camera orientation: ${cameraOrientationLabel}`}
            >
              <ToolButton
                variant={isMirrored ? "default" : "ghost"}
                aria-pressed={isMirrored}
                onClick={() => setIsMirrored((value) => !value)}
              >
                {isMirrored ? "Mirror on" : "Mirror"}
              </ToolButton>
              <ToolButton
                variant={isFlipped ? "default" : "ghost"}
                aria-pressed={isFlipped}
                onClick={() => setIsFlipped((value) => !value)}
              >
                {isFlipped ? "Flip on" : "Flip"}
              </ToolButton>
            </div>
          </div>
        </ToolPanel>
      </ToolWorkspace>

      <ToolPanel labelledBy="camera-gallery-heading">
        <ToolSectionHeading
          title="Local Capture Gallery"
          titleId="camera-gallery-heading"
          row
          description={<ToolHint>{galleryHint}</ToolHint>}
          trailing={
            captures.length > 0 ? (
              <ToolButton variant="ghost" onClick={clearCaptures}>
                Clear all
              </ToolButton>
            ) : null
          }
        />

        {captures.length > 0 ? (
          <div className="capture-gallery">
            {captures.map((capture) => (
              <article key={capture.id} className="capture-card">
                {capture.type === "image" ? (
                  <img
                    src={capture.url}
                    alt={`Photo captured at ${formatCaptureTime(capture.createdAt)}`}
                  />
                ) : (
                  <video src={capture.url} controls />
                )}

                <div className="capture-meta">
                  <div>
                    <strong>{capture.type === "image" ? "Photo" : "Video"}</strong>
                    <span>{formatCaptureTime(capture.createdAt)}</span>
                    <span>{capture.filename}</span>
                  </div>
                  <div className="capture-actions">
                    <ToolButton onClick={() => downloadCapture(capture)}>Download</ToolButton>
                    <ToolButton variant="danger" onClick={() => deleteCapture(capture)}>
                      Delete
                    </ToolButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <ToolEmpty>No captures yet.</ToolEmpty>
        )}
      </ToolPanel>
    </ToolIsland>
  );
}
