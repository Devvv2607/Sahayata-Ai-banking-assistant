"use client";

import { useCallback, useRef, useState } from "react";

const MAX_RECORDING_MS = 30_000; // mirrors the server-side ~30s audio cap

type RecorderState = "idle" | "recording" | "unsupported" | "denied";

/**
 * Push-to-talk audio capture via MediaRecorder. Recording is hard-stopped at 30s to match the
 * backend duration cap. Returns the captured audio Blob on stop.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        resolveRef.current?.(blob);
        resolveRef.current = null;
      };
      recorderRef.current = recorder;
      recorder.start();
      setState("recording");
      timeoutRef.current = setTimeout(() => void stop(), MAX_RECORDING_MS);
    } catch {
      setState("denied");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return null;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const blob = await new Promise<Blob>((resolve) => {
      resolveRef.current = resolve;
      recorder.stop();
    });
    setState("idle");
    return blob;
  }, []);

  return { state, start, stop };
}
