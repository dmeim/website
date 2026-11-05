import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Button,
  ButtonGroup,
  Checkbox,
  EmptyState,
  FormGrid,
  Notice,
  Panel,
  Select,
  ToolFrame,
} from "@/ui/react";
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
  shouldRetryWithoutAudio,
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
  const isMountedRef = useRef(true);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [selectedResolution, setSelectedResolution] = useState<CameraResolutionId>("default");
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<CameraAspectRatioId>("native");
  const [includeAudio, setIncludeAudio] = useState(true);
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
    (video: { url: string; mimeType: string } | null) => {
      cleanupRecordingStream();

      if (!video) {
        setStatusMessage("The recording was empty, so nothing was saved. Try recording for longer.");
        setStatusType("error");
        return;
      }

      addCapture({ type: "video", url: video.url, mimeType: video.mimeType, revokeOnDelete: true });
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

  const stopCameraRef = useRef(stopCamera);
  stopCameraRef.current = stopCamera;

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

  const buildConstraints = useCallback((withAudio: boolean): MediaStreamConstraints => {
    const videoConstraint = buildCameraVideoConstraints({
      deviceId: selectedCameraId,
      resolution: selectedResolution,
      aspectRatio: selectedAspectRatio,
    });

    const audioConstraint: boolean | MediaTrackConstraints = withAudio
      ? selectedMicrophoneId
        ? { deviceId: { exact: selectedMicrophoneId } }
        : true
      : false;

    return {
      audio: audioConstraint,
      video: videoConstraint,
    };
  }, [
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
      let mediaStream: MediaStream;
      let audioMissing = false;

      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(buildConstraints(includeAudio));
      } catch (error) {
        if (!shouldRetryWithoutAudio(error, includeAudio)) {
          throw error;
        }
        mediaStream = await navigator.mediaDevices.getUserMedia(buildConstraints(false));
        audioMissing = true;
      }

      // The tool may have closed while the permission prompt was open.
      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return;
      }

      setStream(mediaStream);
      setStatusMessage(
        audioMissing
          ? "Camera is active, but no microphone was found, so videos will have no sound."
          : "Camera is active. Captures stay local until you download them.",
      );
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
    includeAudio,
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

    // The raw stream keeps recording in a background tab, where a canvas loop would freeze.
    if (!videoRef.current || !stream || !hasCameraTransform) {
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
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);

  // An unplugged camera or a revoked permission ends the track without any other signal.
  useEffect(() => {
    const videoTrack = stream?.getVideoTracks()[0];
    if (!videoTrack) {
      return;
    }

    const handleEnded = () => {
      stopCameraRef.current({ silent: true });
      setStatusMessage("The camera was disconnected or its permission was removed. Start it again to continue.");
      setStatusType("error");
    };

    videoTrack.addEventListener("ended", handleEnded);
    return () => videoTrack.removeEventListener("ended", handleEnded);
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

  // Checked first because browsers hide navigator.mediaDevices on insecure pages.
  if (needsSecureContext) {
    return (
      <ToolFrame>
        <Panel title="Secure context required" animate={false} aria-live="polite">
          <Notice tone="danger">
            Camera APIs require HTTPS or localhost. Open this page over a secure origin.
          </Notice>
        </Panel>
      </ToolFrame>
    );
  }

  if (!isSupported) {
    return (
      <ToolFrame>
        <Panel title="Camera capture is unavailable" animate={false} aria-live="polite">
          <Notice tone="danger">
            Your browser does not expose the camera APIs needed for this tool.
          </Notice>
        </Panel>
      </ToolFrame>
    );
  }

  const statusTone = statusType === "error" ? "danger" : statusType === "success" ? "success" : "neutral";

  return (
    <ToolFrame className="camera-island">
      <div className="camera-workspace">
        <Panel title="Camera controls" titleId="camera-settings-heading">
          <Notice tone={statusTone}>{statusMessage}</Notice>

          {permissionError ? (
            <EmptyState
              icon="video-camera"
              size="sm"
              title="Camera unavailable"
              description={permissionError}
              action={{ label: "Try again", onClick: () => void startCamera() }}
            />
          ) : null}

          <FormGrid columns={2}>
            <Select
              id="camera-device"
              label="Video input"
              span="full"
              value={selectedCameraId}
              onChange={(event) => setSelectedCameraId(event.target.value)}
            >
              {!cameras.length && <option value="">Default camera</option>}
              {cameras.map((camera, index) => (
                <option key={camera.deviceId || index} value={camera.deviceId}>
                  {getDeviceLabel("Camera", camera.label, index)}
                </option>
              ))}
            </Select>

            <Select
              id="camera-resolution"
              label="Resolution"
              value={selectedResolution}
              onChange={(event) =>
                setSelectedResolution(event.target.value as CameraResolutionId)
              }
              options={CAMERA_RESOLUTIONS.map((r) => ({ value: r.value, label: r.label }))}
            />

            <Select
              id="camera-aspect-ratio"
              label="Aspect ratio"
              value={selectedAspectRatio}
              onChange={(event) =>
                setSelectedAspectRatio(event.target.value as CameraAspectRatioId)
              }
              options={CAMERA_ASPECT_RATIOS.map((a) => ({ value: a.value, label: a.label }))}
            />

            <div className="camera-span-full">
              <Checkbox
                id="camera-include-audio"
                label="Include microphone audio in videos"
                checked={includeAudio}
                onChange={(event) => setIncludeAudio(event.target.checked)}
              />
            </div>

            {includeAudio && (
              <Select
                id="camera-microphone"
                label="Audio input"
                span="full"
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
              </Select>
            )}
          </FormGrid>

          <ButtonGroup>
            {!isCameraOn ? (
              <Button variant="primary" iconStart="video-camera" onClick={() => void startCamera()}>
                Start camera
              </Button>
            ) : (
              <Button onClick={() => void startCamera()}>Apply settings</Button>
            )}
            <Button variant="ghost" iconStart="arrows-clockwise" onClick={() => void refreshDevices()}>
              Refresh devices
            </Button>
            {isCameraOn ? (
              <Button variant="danger" iconStart="stop" onClick={() => stopCamera()}>
                Stop camera
              </Button>
            ) : null}
          </ButtonGroup>

          <p className="camera-hint">
            Device labels usually appear after permission is granted. Resolution and aspect ratio
            are best-effort browser constraints. Use Apply settings after changing a device, the
            microphone, or these options while the camera is on.
          </p>
        </Panel>

        <Panel
          title="Live preview"
          titleId="camera-preview-heading"
          description="Use the controls below the preview to capture photos or videos."
        >
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
              <EmptyState
                icon="camera"
                size="sm"
                title="Camera is off"
                description="Start the camera to see a live preview."
              />
            ) : null}
          </div>

          <div className="camera-control-bar">
            <ButtonGroup>
              <Button variant="primary" iconStart="camera" disabled={!isCameraOn} onClick={takePhoto}>
                Take photo
              </Button>

              {isRecordingSupported ? (
                <>
                  {recordingState === "inactive" ? (
                    <Button iconStart="record" disabled={!isCameraOn} onClick={startVideoRecording}>
                      Start recording
                    </Button>
                  ) : null}
                  {recordingState === "recording" ? (
                    <Button iconStart="pause" onClick={pauseRecording}>Pause</Button>
                  ) : null}
                  {recordingState === "paused" ? (
                    <Button iconStart="play" pressed onClick={resumeRecording}>Resume</Button>
                  ) : null}
                  {recordingState !== "inactive" ? (
                    <Button variant="danger" iconStart="stop" onClick={stopRecording}>
                      Stop recording
                    </Button>
                  ) : null}
                </>
              ) : (
                <Notice tone="danger">Video recording is not supported in this browser.</Notice>
              )}
            </ButtonGroup>

            <ButtonGroup label={`Camera orientation: ${cameraOrientationLabel}`}>
              <Button
                variant="ghost"
                pressed={isMirrored}
                onClick={() => setIsMirrored((value) => !value)}
              >
                {isMirrored ? "Mirror on" : "Mirror"}
              </Button>
              <Button
                variant="ghost"
                pressed={isFlipped}
                onClick={() => setIsFlipped((value) => !value)}
              >
                {isFlipped ? "Flip on" : "Flip"}
              </Button>
            </ButtonGroup>
          </div>
        </Panel>
      </div>

      <Panel
        title="Local capture gallery"
        titleId="camera-gallery-heading"
        description={galleryHint}
        actions={
          captures.length > 0 ? (
            <Button variant="ghost" iconStart="trash" onClick={clearCaptures}>
              Clear all
            </Button>
          ) : null
        }
      >
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
                  <strong>{capture.type === "image" ? "Photo" : "Video"}</strong>
                  <span>{formatCaptureTime(capture.createdAt)}</span>
                  <span className="capture-meta__file">{capture.filename}</span>
                </div>
                <ButtonGroup>
                  <Button size="sm" iconStart="download-simple" onClick={() => downloadCapture(capture)}>
                    Download
                  </Button>
                  <Button size="sm" variant="danger" iconStart="trash" onClick={() => deleteCapture(capture)}>
                    Delete
                  </Button>
                </ButtonGroup>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState icon="images" size="sm" title="No captures yet" />
        )}
      </Panel>
    </ToolFrame>
  );
}
