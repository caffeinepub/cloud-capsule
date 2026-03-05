import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Principal } from "@dfinity/principal";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Brain, FileText, Heart, Image, Loader2, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Media, Note } from "../backend.d";
import { MediaType } from "../backend.d";
import { useActor } from "../hooks/useActor";
import {
  type NeuronEntryWithId,
  useGetCapsuleMedia,
  useGetCapsuleNotes,
  useGetGlobalInstructions,
  useGetNeuronEntries,
} from "../hooks/useQueries";
import { formatTime } from "../utils/crypto";

function MemorialHeader({
  ownerName,
  ownerPrincipal,
  onLogout,
}: {
  ownerName: string | null;
  ownerPrincipal: string;
  onLogout: () => void;
}) {
  return (
    <motion.header
      className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-sm"
      style={{ background: "oklch(0.13 0.04 265 / 0.92)" }}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/assets/generated/cloud-capsule-logo-transparent.png"
            alt="Cloud Capsule"
            className="w-8 h-8 object-contain"
          />
          <div>
            <h1 className="font-display text-base font-semibold text-gradient-sky">
              {ownerName ? `${ownerName}'s Capsule` : "Cloud Capsule"}
            </h1>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
              {ownerPrincipal}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="gap-1.5 text-xs text-muted-foreground"
          data-ocid="capsule.button"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Button>
      </div>
    </motion.header>
  );
}

function NoteCard({ note, idx }: { note: Note; idx: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="capsule-card p-5 cursor-pointer"
      onClick={() => setExpanded((e) => !e)}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      data-ocid={`capsule.notes.item.${idx + 1}`}
    >
      <div className="flex items-start gap-3">
        <FileText
          className="w-4 h-4 mt-0.5 flex-shrink-0"
          style={{ color: "oklch(0.67 0.18 230)" }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-display font-semibold text-foreground text-sm">
            {note.title}
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            {formatTime(note.updatedAt)}
          </p>
          {expanded ? (
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {note.body}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {note.body}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function MediaItem({ media, idx }: { media: Media; idx: number }) {
  const url = media.blobId
    ? ExternalBlob.fromURL(media.blobId).getDirectURL()
    : null;

  return (
    <motion.div
      className="capsule-card overflow-hidden"
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      data-ocid={`capsule.media.item.${idx + 1}`}
    >
      <div className="relative bg-muted" style={{ aspectRatio: "16/10" }}>
        {url && media.mediaType === MediaType.photo && (
          <img
            src={url}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        )}
        {url && media.mediaType === MediaType.video && (
          // biome-ignore lint/a11y/useMediaCaption: personal memory video, captions not applicable
          <video
            src={url}
            controls
            className="w-full h-full object-cover"
            preload="metadata"
          />
        )}
        {!url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image className="w-8 h-8 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium text-sm text-foreground">{media.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatTime(media.createdAt)}
        </p>
      </div>
    </motion.div>
  );
}

function NeuronEntryItem({
  entry,
  idx,
}: { entry: NeuronEntryWithId; idx: number }) {
  return (
    <motion.div
      className="capsule-card p-5 space-y-3"
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      data-ocid={`capsule.neurons.item.${idx + 1}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "oklch(0.67 0.18 230 / 0.1)" }}
        >
          <Brain
            className="w-4 h-4"
            style={{ color: "oklch(0.67 0.18 230)" }}
          />
        </div>
        <div>
          <p className="font-display font-semibold text-sm text-foreground">
            Neuron #{entry.neuronId}
          </p>
          {entry.dissolveDate && (
            <p className="text-xs text-muted-foreground">
              Dissolves: {entry.dissolveDate}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-border/50 text-sm">
        {entry.designatedController && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Designated Controller
            </p>
            <p className="font-mono text-xs text-foreground break-all">
              {entry.designatedController}
            </p>
          </div>
        )}
        {entry.votingPreferences && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Voting Preferences
            </p>
            <p className="text-foreground text-sm">{entry.votingPreferences}</p>
          </div>
        )}
        {entry.notes && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Notes
            </p>
            <p className="text-foreground text-sm whitespace-pre-wrap">
              {entry.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function BeneficiaryCapsulePage() {
  const { ownerPrincipal: ownerPrincipalStr } = useParams({
    strict: false,
  }) as { ownerPrincipal: string };
  const navigate = useNavigate();
  const { actor } = useActor();

  const [validating, setValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [ownerPrincipal, setOwnerPrincipal] = useState<Principal | null>(null);

  const token = localStorage.getItem("beneficiary_session_token") ?? "";

  const validateSession = useCallback(async () => {
    if (!actor || !token) {
      setValidating(false);
      setIsValid(false);
      return;
    }

    try {
      const valid = await actor.isLoggedInToBeneficiarySession(token);
      if (valid) {
        const principal = Principal.fromText(ownerPrincipalStr);
        setOwnerPrincipal(principal);
        setIsValid(true);
      } else {
        setIsValid(false);
      }
    } catch {
      setIsValid(false);
    } finally {
      setValidating(false);
    }
  }, [actor, token, ownerPrincipalStr]);

  useEffect(() => {
    if (actor) validateSession();
  }, [actor, validateSession]);

  // Redirect if invalid
  useEffect(() => {
    if (!validating && !isValid) {
      toast.error("Session expired. Please sign in again.");
      navigate({ to: "/access" });
    }
  }, [validating, isValid, navigate]);

  const { data: notes = [], isLoading: notesLoading } =
    useGetCapsuleNotes(ownerPrincipal);
  const { data: mediaList = [], isLoading: mediaLoading } =
    useGetCapsuleMedia(ownerPrincipal);
  const { data: neuronEntries = [], isLoading: neuronsLoading } =
    useGetNeuronEntries(ownerPrincipal);
  const { data: globalInstructions = "", isLoading: globalLoading } =
    useGetGlobalInstructions(ownerPrincipal);

  const handleLogout = async () => {
    try {
      if (actor && token) {
        await actor.beneficiaryLogout(token);
      }
    } catch {
      // ignore
    }
    localStorage.removeItem("beneficiary_session_token");
    localStorage.removeItem("beneficiary_capsule_owner");
    navigate({ to: "/" });
  };

  if (validating || !isValid) {
    return (
      <div className="min-h-screen bg-space flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space flex flex-col">
      <MemorialHeader
        ownerName={null}
        ownerPrincipal={ownerPrincipalStr}
        onLogout={handleLogout}
      />

      {/* In memoriam banner */}
      <motion.div
        className="relative overflow-hidden py-10 px-6 text-center"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.67 0.18 230 / 0.08) 0%, oklch(0.58 0.22 285 / 0.06) 100%)",
          borderBottom: "1px solid oklch(0.26 0.05 265)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, oklch(0.67 0.18 230 / 0.1), transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(to right, transparent, oklch(0.67 0.18 230 / 0.4))",
              }}
            />
            <Heart
              className="w-4 h-4"
              style={{ color: "oklch(0.67 0.18 230)" }}
            />
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(to left, transparent, oklch(0.67 0.18 230 / 0.4))",
              }}
            />
          </div>
          <p className="font-display text-lg italic text-foreground/80">
            "In loving memory — these words and memories were preserved for
            you."
          </p>
          <p className="text-xs text-muted-foreground">
            This is a private capsule. The contents are shared with you out of
            love and trust.
          </p>
        </div>
      </motion.div>

      {/* Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-8 py-8">
        <Tabs defaultValue="notes">
          <div className="overflow-x-auto pb-1">
            <TabsList
              className="mb-8 gap-1 h-auto p-1 rounded-xl"
              style={{
                background: "oklch(0.17 0.045 265 / 0.7)",
                border: "1px solid oklch(0.26 0.05 265)",
              }}
            >
              {[
                { value: "notes", icon: FileText, label: "Notes" },
                { value: "media", icon: Image, label: "Photos & Videos" },
                { value: "neurons", icon: Brain, label: "ICP Guidance" },
              ].map(({ value, icon: Icon, label }) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all data-[state=active]:bg-gradient-sky data-[state=active]:text-white data-[state=active]:shadow-cloud-sm"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Notes */}
          <TabsContent value="notes" className="mt-0">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Notes & Letters
              </h2>
              {notesLoading && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 rounded-xl" />
                  ))}
                </div>
              )}
              {!notesLoading && notes.length === 0 && (
                <div
                  className="text-center py-14"
                  data-ocid="capsule.notes.empty_state"
                >
                  <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    No notes have been left yet.
                  </p>
                </div>
              )}
              {!notesLoading && notes.length > 0 && (
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {notes.map((note, idx) => (
                    <NoteCard key={note.id} note={note} idx={idx} />
                  ))}
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Media */}
          <TabsContent value="media" className="mt-0">
            <div className="space-y-4">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Photos & Videos
              </h2>
              {mediaLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-video rounded-xl" />
                  ))}
                </div>
              )}
              {!mediaLoading && mediaList.length === 0 && (
                <div
                  className="text-center py-14"
                  data-ocid="capsule.media.empty_state"
                >
                  <Image className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    No photos or videos shared yet.
                  </p>
                </div>
              )}
              {!mediaLoading && mediaList.length > 0 && (
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
                    <MediaItem key={media.id} media={media} idx={idx} />
                  ))}
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Neurons */}
          <TabsContent value="neurons" className="mt-0">
            <div className="space-y-6">
              <h2 className="font-display text-xl font-semibold text-foreground">
                ICP & Neuron Guidance
              </h2>

              {/* Global instructions */}
              {(globalLoading || globalInstructions) && (
                <div className="capsule-card p-6 space-y-3">
                  <h3 className="font-display font-semibold text-foreground text-sm">
                    General Instructions
                  </h3>
                  {globalLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {globalInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Neuron entries */}
              {neuronsLoading && (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                  ))}
                </div>
              )}
              {!neuronsLoading &&
                neuronEntries.length === 0 &&
                !globalInstructions && (
                  <div
                    className="text-center py-14"
                    data-ocid="capsule.neurons.empty_state"
                  >
                    <Brain className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-muted-foreground text-sm">
                      No ICP instructions have been added.
                    </p>
                  </div>
                )}
              {!neuronsLoading && neuronEntries.length > 0 && (
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.06 } },
                  }}
                >
                  {neuronEntries.map((entry, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: entries may share neuronId
                    <NeuronEntryItem
                      key={`${entry.neuronId}-${idx}`}
                      entry={entry}
                      idx={idx}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-5 px-6 text-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with{" "}
          <Heart className="w-3 h-3 inline text-red-400" /> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
