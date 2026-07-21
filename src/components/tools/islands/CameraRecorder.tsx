import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
      <div className="tool-island camera-island">
        <section className="tool-panel" aria-live="polite">
          <h2>Camera capture is unavailable</h2>
          <p className="tool-status tool-status--error">
            Your browser does not expose the camera APIs needed for this tool.
          </p>
        </section>
      </div>
    );
  }

  if (needsSecureContext) {
    return (
      <div className="tool-island camera-island">
        <section className="tool-panel" aria-live="polite">
          <h2>Secure context required</h2>
          <p className="tool-status tool-status--error">
            Camera APIs require HTTPS or localhost. Open this page over a secure origin.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="tool-island camera-island">
      <div className="tool-workspace">
        <section className="tool-panel" aria-labelledby="camera-settings-heading">
          <div className="tool-section-heading">
            <h2 id="camera-settings-heading">Camera Controls</h2>
            <p
              className={`tool-status${statusType ? ` tool-status--${statusType}` : ""}`}
              aria-live="polite"
            >
              {statusMessage}
            </p>
          </div>

          {permissionError && (
            <p className="tool-status tool-status--error">{permissionError}</p>
          )}

          <div className="tool-form-grid">
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

            <label className="tool-check tool-check--full" htmlFor="camera-include-audio">
              <input
                id="camera-include-audio"
                type="checkbox"
                checked={includeAudio}
                onChange={(event) => setIncludeAudio(event.target.checked)}
              />
              Include microphone audio in videos
            </label>

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
          </div>

          <div className="tool-actions">
            {!isCameraOn ? (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => void startCamera()}
              >
                Start camera
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => void startCamera()}>
                Apply settings
              </button>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => void refreshDevices()}>
              Refresh devices
            </button>
            {isCameraOn && (
              <button
                type="button"
                className="btn tool-btn--danger"
                onClick={() => stopCamera()}
              >
                Stop camera
              </button>
            )}
          </div>

          <p className="tool-hint">
            Device labels usually appear after permission is granted. Resolution and aspect ratio
            are best-effort browser constraints; use Apply settings after changing them while the
            camera is on.
          </p>
        </section>

        <section className="tool-panel" aria-labelledby="camera-preview-heading">
          <div className="tool-section-heading">
            <h2 id="camera-preview-heading">Live Preview</h2>
            <p className="tool-hint">
              Use the controls below the preview to capture photos or videos.
            </p>
          </div>

          <div className="camera-preview-frame">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              hidden={!isCameraOn}
              style={{ transform: cameraTransform }}
            />
            {!isCameraOn && (
              <p className="tool-empty">Start the camera to see a live preview.</p>
            )}
          </div>

          <div className="camera-control-bar">
            <div className="camera-capture-controls">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!isCameraOn}
                onClick={takePhoto}
              >
                Take photo
              </button>

              {isRecordingSupported ? (
                <>
                  {recordingState === "inactive" && (
                    <button
                      type="button"
                      className="btn"
                      disabled={!isCameraOn}
                      onClick={startVideoRecording}
                    >
                      Start recording
                    </button>
                  )}
                  {recordingState === "recording" && (
                    <button type="button" className="btn" onClick={pauseRecording}>
                      Pause
                    </button>
                  )}
                  {recordingState === "paused" && (
                    <button type="button" className="btn" onClick={resumeRecording}>
                      Resume
                    </button>
                  )}
                  {recordingState !== "inactive" && (
                    <button
                      type="button"
                      className="btn tool-btn--danger"
                      onClick={stopRecording}
                    >
                      Stop recording
                    </button>
                  )}
                </>
              ) : (
                <p className="tool-status tool-status--error">
                  Video recording is not supported in this browser.
                </p>
              )}
            </div>

            <div
              className="camera-orientation-controls"
              aria-label={`Camera orientation: ${cameraOrientationLabel}`}
            >
              <button
                type="button"
                className={isMirrored ? "btn" : "btn btn--ghost"}
                aria-pressed={isMirrored}
                onClick={() => setIsMirrored((value) => !value)}
              >
                {isMirrored ? "Mirror on" : "Mirror"}
              </button>
              <button
                type="button"
                className={isFlipped ? "btn" : "btn btn--ghost"}
                aria-pressed={isFlipped}
                onClick={() => setIsFlipped((value) => !value)}
              >
                {isFlipped ? "Flip on" : "Flip"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="tool-panel" aria-labelledby="camera-gallery-heading">
        <div className="tool-section-heading tool-section-heading--row">
          <div>
            <h2 id="camera-gallery-heading">Local Capture Gallery</h2>
            <p className="tool-hint">{galleryHint}</p>
          </div>
          {captures.length > 0 && (
            <button type="button" className="btn btn--ghost" onClick={clearCaptures}>
              Clear all
            </button>
          )}
        </div>

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
                    <button
                      type="button"
                      className="btn"
                      onClick={() => downloadCapture(capture)}
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      className="btn tool-btn--danger"
                      onClick={() => deleteCapture(capture)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="tool-empty">No captures yet.</p>
        )}
      </section>
    </div>
  );
}
