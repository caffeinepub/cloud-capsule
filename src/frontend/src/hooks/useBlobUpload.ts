import { useCallback, useState } from "react";
import { ExternalBlob } from "../backend";
import { useActor } from "./useActor";

export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
}

/**
 * Hook for uploading files via blob storage.
 * Returns the blobId (hash string) which can be passed to createMedia.
 *
 * We use the actor's internal _uploadFile by wrapping ExternalBlob.fromBytes
 * and calling it through the config-created uploadFile function.
 * Since we can't directly access the upload function, we use a workaround:
 * We create the media via the actor which handles the blob internally.
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
   * The actor's internal uploadFile handles the blob storage upload.
   * We use ExternalBlob.fromBytes to prepare the blob.
   */
  const uploadFile = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<string> => {
      if (!actor) throw new Error("Actor not available");

      setState({ isUploading: true, progress: 0, error: null });

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        let blob = ExternalBlob.fromBytes(bytes);
        if (onProgress) {
          blob = blob.withUploadProgress((percentage) => {
            setState((prev) => ({ ...prev, progress: percentage }));
            onProgress(percentage);
          });
        }

        // Use the actor's internal upload function (accessed via the actor wrapper)
        // The actor wrapper exposes _uploadFile as part of its class
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
