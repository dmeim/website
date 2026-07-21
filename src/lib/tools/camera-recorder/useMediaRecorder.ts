import { useCallback, useEffect, useRef, useState } from "react";

const PREFERRED_VIDEO_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
  "video/mp4",
];

export interface RecordedVideo {
  url: string;
  mimeType: string;
}

export function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") {
    return "";
  }

  return PREFERRED_VIDEO_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function useMediaRecorder(
  stream: MediaStream | null,
  onRecordingAvailable?: (video: RecordedVideo) => void,
) {
  const [recordingState, setRecordingState] = useState<RecordingState>("inactive");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const currentMimeTypeRef = useRef("");
  const onRecordingAvailableRef = useRef(onRecordingAvailable);
  const isRecordingSupported =
    typeof MediaRecorder !== "undefined" && Boolean(getSupportedVideoMimeType());

  useEffect(() => {
    onRecordingAvailableRef.current = onRecordingAvailable;
  }, [onRecordingAvailable]);

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    if (!isRecordingSupported || !stream || recordingState !== "inactive") {
      return;
    }

    currentMimeTypeRef.current = getSupportedVideoMimeType();
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(
      stream,
      currentMimeTypeRef.current ? { mimeType: currentMimeTypeRef.current } : undefined,
    );

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      const mimeType = currentMimeTypeRef.current || "video/webm";
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      recordedChunksRef.current = [];
      mediaRecorderRef.current = null;
      setRecordingState("inactive");

      if (blob.size > 0) {
        const url = URL.createObjectURL(blob);
        onRecordingAvailableRef.current?.({ url, mimeType: blob.type || mimeType });
      }
    };

    recorder.onpause = () => {
      setRecordingState("paused");
    };

    recorder.onresume = () => {
      setRecordingState("recording");
    };

    recorder.onerror = () => {
      setRecordingState("inactive");
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecordingState("recording");
  }, [isRecordingSupported, recordingState, stream]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || recordingState === "inactive") {
      return;
    }

    mediaRecorderRef.current.stop();
  }, [recordingState]);

  const pauseRecording = useCallback(() => {
    if (!mediaRecorderRef.current || recordingState !== "recording") {
      return;
    }

    mediaRecorderRef.current.pause();
  }, [recordingState]);

  const resumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || recordingState !== "paused") {
      return;
    }

    mediaRecorderRef.current.resume();
  }, [recordingState]);

  return {
    isRecordingSupported,
    pauseRecording,
    recordingState,
    resumeRecording,
    startRecording,
    stopRecording,
  };
}
