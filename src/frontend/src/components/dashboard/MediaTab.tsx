import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import type { Principal } from "@dfinity/principal";
import {
  Download,
  ImageIcon,
  Images,
  Loader2,
  Play,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Media } from "../../backend.d";
import { MediaType } from "../../backend.d";
import { useBlobUpload } from "../../hooks/useBlobUpload";
import {
  useCreateMedia,
  useDeleteMedia,
  useGetCapsuleMedia,
} from "../../hooks/useQueries";
import { formatTime } from "../../utils/crypto";

interface MediaTabProps {
  ownerPrincipal: Principal;
}

function MediaCard({
  media,
  idx,
  onDelete,
}: { media: Media; idx: number; onDelete: () => void }) {
  const { getBlobUrl } = useBlobUpload();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Load blob URL correctly via getBlobUrl (async, returns CDN URL)
  useEffect(() => {
    if (!media.blobId) {
      setUrlLoading(false);
      return;
    }
    let cancelled = false;
    setUrlLoading(true);
    getBlobUrl(media.blobId)
      .then((url) => {
        if (!cancelled) {
          setBlobUrl(url || null);
          setUrlLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBlobUrl(null);
          setUrlLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [media.blobId, getBlobUrl]);

  const handleDownload = useCallback(async () => {
    if (!blobUrl) return;
    try {
      const response = await fetch(blobUrl);
      const rawBlob = await response.blob();
      const isVideo = media.mediaType === MediaType.video;
      const mimeType = isVideo ? "video/mp4" : "image/jpeg";
      const ext = isVideo ? ".mp4" : ".jpg";
      // Re-type the blob to ensure the browser treats it correctly
      const blob = new Blob([rawBlob], { type: mimeType });
      const filename = `${media.title.replace(/[^a-z0-9_\-. ]/gi, "_")}${ext}`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Download failed. Please try again.");
    }
  }, [blobUrl, media.title, media.mediaType]);

  return (
    <>
      <motion.div
        className="capsule-card overflow-hidden flex flex-col"
        variants={{
          hidden: { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0 },
        }}
        data-ocid={`media.item.${idx + 1}`}
      >
        {/* Thumbnail — clickable to open lightbox */}
        <button
          type="button"
          className="relative bg-muted w-full overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 group"
          style={{ aspectRatio: "16/10" }}
          onClick={() => setLightboxOpen(true)}
          disabled={urlLoading || !blobUrl}
          aria-label={`View ${media.title}`}
          data-ocid={`media.open_modal_button.${idx + 1}`}
        >
          {urlLoading && <Skeleton className="absolute inset-0 rounded-none" />}

          {!urlLoading && blobUrl && media.mediaType === MediaType.photo && (
            <>
              <img
                src={blobUrl}
                alt={media.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setBlobUrl(null)}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/20 backdrop-blur-sm rounded-full p-2">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            </>
          )}

          {!urlLoading && blobUrl && media.mediaType === MediaType.video && (
            <>
              {/* Video poster / thumbnail area */}
              {/* biome-ignore lint/a11y/useMediaCaption: video captions not required for personal memory uploads */}
              <video
                src={blobUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors duration-200">
                <div className="bg-white/25 backdrop-blur-sm rounded-full p-3 group-hover:scale-110 transition-transform duration-200">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
            </>
          )}

          {!urlLoading && !blobUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              {media.mediaType === MediaType.video ? (
                <Video className="w-8 h-8 text-muted-foreground/40" />
              ) : (
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              )}
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2 left-2 pointer-events-none">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: "oklch(0.13 0.04 265 / 0.75)",
                color: "oklch(0.82 0.1 225)",
                backdropFilter: "blur(4px)",
              }}
            >
              {media.mediaType === MediaType.video ? (
                <>
                  <Play className="w-2.5 h-2.5" />
                  Video
                </>
              ) : (
                <>
                  <ImageIcon className="w-2.5 h-2.5" />
                  Photo
                </>
              )}
            </span>
          </div>
        </button>

        <div className="p-4 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm text-foreground truncate">
              {media.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatTime(media.createdAt)}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Download button */}
            {blobUrl && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleDownload}
                title="Download"
                data-ocid={`media.download_button.${idx + 1}`}
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
              </Button>
            )}

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-ocid={`media.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this media?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{media.title}" will be permanently removed from your
                    capsule.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="media.cancel_button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    data-ocid="media.confirm_button"
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </motion.div>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          className="max-w-3xl w-full p-0 overflow-hidden"
          data-ocid="media.dialog"
          style={{ background: "oklch(0.1 0.03 265)" }}
        >
          <DialogHeader className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between gap-4">
              <DialogTitle className="font-display text-foreground truncate">
                {media.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={() => setLightboxOpen(false)}
                data-ocid="media.close_button"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatTime(media.createdAt)}
            </p>
          </DialogHeader>

          {/* Media display */}
          <div
            className="relative w-full flex items-center justify-center"
            style={{
              background: "oklch(0.08 0.02 265)",
              minHeight: "300px",
              maxHeight: "70vh",
            }}
          >
            {blobUrl && media.mediaType === MediaType.photo && (
              <img
                src={blobUrl}
                alt={media.title}
                className="max-w-full max-h-[70vh] object-contain"
              />
            )}
            {blobUrl && media.mediaType === MediaType.video && (
              // biome-ignore lint/a11y/useMediaCaption: video captions not required for personal memory uploads
              <video
                src={blobUrl}
                controls
                autoPlay
                className="max-w-full max-h-[70vh] object-contain"
                style={{ outline: "none" }}
              />
            )}
          </div>

          {/* Footer actions */}
          <DialogFooter className="px-5 py-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {media.mediaType === MediaType.video ? "Video" : "Photo"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownload}
              disabled={!blobUrl}
              data-ocid="media.download_button"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MediaTab({ ownerPrincipal }: MediaTabProps) {
  const { data: mediaList = [], isLoading } =
    useGetCapsuleMedia(ownerPrincipal);
  const createMedia = useCreateMedia();
  const deleteMedia = useDeleteMedia();
  const { isUploading, progress, uploadFile } = useBlobUpload();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [compress, setCompress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !title.trim()) return;

    try {
      const isVideo = selectedFile.type.startsWith("video/");
      const blobId = await uploadFile(selectedFile, {
        compress: compress && isVideo,
      });
      await createMedia.mutateAsync({
        title: title.trim(),
        blobId,
        mediaType: isVideo ? MediaType.video : MediaType.photo,
      });
      toast.success("Media uploaded to your capsule");
      setUploadOpen(false);
      setSelectedFile(null);
      setTitle("");
    } catch {
      toast.error("Upload failed. Please try again.");
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      await deleteMedia.mutateAsync(mediaId);
      toast.success("Media removed from capsule");
    } catch {
      toast.error("Failed to delete media");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground">
            Photos & Videos
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Upload memories, video messages, and photos for your loved ones.
          </p>
        </div>
        <Button
          onClick={() => setUploadOpen(true)}
          data-ocid="media.upload_button"
          className="gap-2 bg-gradient-sky border-0 text-white hover:opacity-90 transition-opacity"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="aspect-video rounded-xl"
              data-ocid="media.loading_state"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && mediaList.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="media.empty_state"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "oklch(0.67 0.18 230 / 0.1)" }}
          >
            <Images
              className="w-7 h-7"
              style={{ color: "oklch(0.67 0.18 230)" }}
            />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            No media yet
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Upload photos and videos so your loved ones can see your face and
            hear your voice.
          </p>
        </div>
      )}

      {/* Media grid */}
      {!isLoading && mediaList.length > 0 && (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.06 } },
          }}
        >
          {mediaList.map((media, idx) => (
            <MediaCard
              key={media.id}
              media={media}
              idx={idx}
              onDelete={() => handleDelete(media.id)}
            />
          ))}
        </motion.div>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadOpen}
        onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            setTitle("");
          }
        }}
      >
        <DialogContent className="max-w-md" data-ocid="media.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Upload Media</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            {/* Dropzone */}
            <button
              type="button"
              className="w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors hover:border-primary/40"
              style={{
                borderColor: selectedFile
                  ? "oklch(0.67 0.18 230 / 0.5)"
                  : "oklch(0.26 0.05 265)",
                background: selectedFile
                  ? "oklch(0.67 0.18 230 / 0.06)"
                  : "transparent",
              }}
              onClick={() => fileInputRef.current?.click()}
              data-ocid="media.dropzone"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div className="space-y-1">
                  {selectedFile.type.startsWith("video/") ? (
                    <Video
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: "oklch(0.67 0.18 230)" }}
                    />
                  ) : (
                    <ImageIcon
                      className="w-8 h-8 mx-auto mb-2"
                      style={{ color: "oklch(0.67 0.18 230)" }}
                    />
                  )}
                  <p className="font-medium text-sm text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                  <p className="text-sm text-muted-foreground">
                    Click to select a photo or video
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Photos: JPG, PNG, GIF, WEBP · Videos: MP4, MOV, WEBM (up to
                    10 min)
                  </p>
                </>
              )}
            </button>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="media-title">Title</Label>
              <Input
                id="media-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Family vacation 2023"
                data-ocid="media.input"
              />
            </div>

            {/* Compress toggle (for videos) */}
            {selectedFile?.type.startsWith("video/") && (
              <div
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "oklch(0.67 0.18 230 / 0.07)" }}
              >
                <div>
                  <p className="text-sm font-medium">Optimize for upload</p>
                  <p className="text-xs text-muted-foreground">
                    Reduces file size — recommended for large videos
                  </p>
                </div>
                <Switch
                  checked={compress}
                  onCheckedChange={setCompress}
                  data-ocid="media.switch"
                />
              </div>
            )}

            {/* Upload progress */}
            {isUploading && (
              <div className="space-y-2" data-ocid="media.loading_state">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uploading...</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadOpen(false)}
                data-ocid="media.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isUploading ||
                  createMedia.isPending ||
                  !selectedFile ||
                  !title.trim()
                }
                data-ocid="media.submit_button"
                className="bg-gradient-sky border-0 text-white hover:opacity-90 transition-opacity"
              >
                {isUploading || createMedia.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
