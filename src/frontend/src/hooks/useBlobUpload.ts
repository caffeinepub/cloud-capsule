import { useCallback, useState } from "react";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Compress a video file client-side by re-encoding it at a lower resolution
 * using the browser's MediaRecorder API. Falls back to original if not supported.
 */
async function compressVideo(file: File): Promise<File> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);
    video.src = url;
    video.muted = true;

    video.onloadedmetadata = () => {
      const targetWidth = Math.min(video.videoWidth, 854); // 480p-ish width
      const targetHeight = Math.round(
        (video.videoHeight / video.videoWidth) * targetWidth,
      );

      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx || !("MediaRecorder" in window)) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : null;

      if (!mimeType) {
        URL.revokeObjectURL(url);
        resolve(file);
        return;
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 800_000, // ~800 kbps
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        URL.revokeObjectURL(url);
        const compressed = new Blob(chunks, { type: mimeType });
        // Only use compressed if it's actually smaller
        const result =
          compressed.size < file.size
            ? new File([compressed], file.name.replace(/\.[^.]+$/, ".webm"), {
                type: mimeType,
              })
            : file;
        resolve(result);
      };

      video.onplay = () => {
        recorder.start();
        const drawFrame = () => {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          requestAnimationFrame(drawFrame);
        };
        drawFrame();
      };

      video.play().catch(() => {
        URL.revokeObjectURL(url);
        resolve(file);
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
  });
}

/**
 * Hook for uploading files via blob storage.
 * Returns the blobId (hash string) which can be passed to createMedia.
 */
export function useBlobUpload() {
  const { actor } = useActor();

  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  });

  /**
   * Upload a file and return the blobId.
   * Pass compress=true for videos to apply client-side compression before upload.
   */
  const uploadFile = useCallback(
    async (
      file: File,
      options?: { compress?: boolean; onProgress?: (pct: number) => void },
    ): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      setState({ isUploading: true, progress: 0, error: null });

      try {
        // Apply video compression if requested
        let fileToUpload = file;
        if (options?.compress && file.type.startsWith("video/")) {
          setState((prev) => ({ ...prev, progress: 5 }));
          fileToUpload = await compressVideo(file);
        }

        const arrayBuffer = await fileToUpload.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let blob = ExternalBlob.fromBytes(bytes);
        blob = blob.withUploadProgress((percentage) => {
          // Map upload progress to 10-100% range (first 10% reserved for compression)
          const adjusted = options?.compress
            ? Math.round(10 + (percentage * 90) / 100)
            : percentage;
          setState((prev) => ({ ...prev, progress: adjusted }));
          options?.onProgress?.(adjusted);
        });

        const internalActor = actor as unknown as {
          _uploadFile: (file: ExternalBlob) => Promise<Uint8Array>;
        };

        const resultBytes = await internalActor._uploadFile(blob);
        const hashWithPrefix = new TextDecoder().decode(
          new Uint8Array(resultBytes),
        );
        // Strip the deduplication sentinel "!caf!" prefix
        const blobId = hashWithPrefix.startsWith("!caf!")
          ? hashWithPrefix.substring(5)
          : hashWithPrefix;

        setState({ isUploading: false, progress: 100, error: null });
        return blobId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ isUploading: false, progress: 0, error: message });
        throw err;
      }
    },
    [actor],
  );

  /**
   * Get the direct URL for a stored blob by its blobId.
   */
  const getBlobUrl = useCallback(
    async (blobId: string): Promise<string> => {
      if (!actor) return "";
      const internalActor = actor as unknown as {
        _downloadFile: (bytes: Uint8Array) => Promise<ExternalBlob>;
      };
      const sentinel = `!caf!${blobId}`;
      const bytes = new TextEncoder().encode(sentinel);
      const blob = await internalActor._downloadFile(bytes);
      return blob.getDirectURL();
    },
    [actor],
  );

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, error: null });
  }, []);

  return { ...state, uploadFile, getBlobUrl, reset };
}
