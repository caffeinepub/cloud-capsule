import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  BarChart3,
  CheckCheck,
  Copy,
  ExternalLink,
  Heart,
  Loader2,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { useGetCanisterId } from "../../hooks/useQueries";

interface SettingsTabProps {
  userProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export default function SettingsTab({
  userProfile,
  onSaveProfile,
}: SettingsTabProps) {
  const {
    data: canisterId,
    isLoading: canisterLoading,
    isError: canisterError,
  } = useGetCanisterId();
  const [copiedCanister, setCopiedCanister] = useState(false);
  const [copiedCanisterInDialog, setCopiedCanisterInDialog] = useState(false);
  const [profileName, setProfileName] = useState(userProfile?.name ?? "");
  const [profileDirty, setProfileDirty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile?.name) setProfileName(userProfile.name);
  }, [userProfile?.name]);

  const handleCopyCanister = () => {
    const id = canisterId ?? "";
    navigator.clipboard.writeText(id);
    setCopiedCanister(true);
    toast.success("Canister ID copied");
    setTimeout(() => setCopiedCanister(false), 2000);
  };

  const handleCopyCanisterInDialog = () => {
    const id = canisterId ?? "";
    navigator.clipboard.writeText(id);
    setCopiedCanisterInDialog(true);
    toast.success("Canister ID copied");
    setTimeout(() => setCopiedCanisterInDialog(false), 2000);
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return;
    setSavingProfile(true);
    try {
      await onSaveProfile({ name: profileName.trim() });
      setProfileDirty(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-display text-2xl font-semibold text-foreground">
          Settings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your capsule's resources and profile.
        </p>
      </div>

      {/* Profile section */}
      <div className="capsule-card p-6 space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <User className="w-4 h-4" style={{ color: "oklch(0.67 0.18 230)" }} />
          <h3 className="font-display font-semibold text-foreground">
            Profile
          </h3>
        </div>
        <div className="space-y-2">
          <Label>Your Name</Label>
          <Input
            value={profileName}
            onChange={(e) => {
              setProfileName(e.target.value);
              setProfileDirty(true);
            }}
            placeholder="Your name"
            data-ocid="settings.input"
          />
        </div>
        {profileDirty && (
          <Button
            onClick={handleSaveProfile}
            disabled={savingProfile || !profileName.trim()}
            size="sm"
            className="gap-2 bg-gradient-sky border-0 text-white hover:opacity-90 transition-opacity"
            data-ocid="settings.save_button"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        )}
      </div>

      {/* Canister ID */}
      <div className="capsule-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4" style={{ color: "oklch(0.67 0.18 230)" }} />
          <h3 className="font-display font-semibold text-foreground">
            Your Canister ID
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is your capsule's unique identifier on the Internet Computer. You
          need it to top up cycles via the NNS app and to check your cycle
          balance on the IC Dashboard.
        </p>
        {canisterLoading ? (
          <Skeleton
            className="h-12 rounded-xl"
            data-ocid="settings.loading_state"
          />
        ) : (
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs font-mono text-foreground break-all p-3 rounded-lg"
              style={{ background: "oklch(0.17 0.045 265 / 0.6)" }}
              data-ocid="settings.panel"
            >
              {canisterId ??
                (canisterError
                  ? "Error loading — please refresh"
                  : "Not available")}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 flex-shrink-0"
              onClick={handleCopyCanister}
              disabled={!canisterId}
              data-ocid="settings.copy_canister_id_button"
              title="Copy Canister ID"
            >
              {copiedCanister ? (
                <CheckCheck
                  className="w-4 h-4"
                  style={{ color: "oklch(0.67 0.18 230)" }}
                />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Cycle Balance Monitor */}
      <div className="capsule-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <BarChart3
            className="w-4 h-4"
            style={{ color: "oklch(0.67 0.18 230)" }}
          />
          <h3 className="font-display font-semibold text-foreground">
            Monitor Cycle Balance
          </h3>
        </div>

        <div
          className="rounded-xl px-4 py-4 flex items-start gap-3"
          style={{
            background: "oklch(0.67 0.18 230 / 0.07)",
            border: "1px solid oklch(0.67 0.18 230 / 0.18)",
          }}
        >
          <Heart
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            style={{ color: "oklch(0.67 0.18 230)" }}
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">
              What are cycles?
            </span>{" "}
            Cycles are the fuel that powers your capsule. Keeping your canister
            topped up ensures your loved ones can always access what you've left
            for them. A small amount of ICP can keep your capsule running for
            years.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          To check your live cycle balance, open the IC Dashboard and search for
          your Canister ID. Your balance is shown at the top of the canister
          page and updates in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {canisterId && (
            <a
              href={`https://dashboard.internetcomputer.org/canister/${canisterId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-opacity hover:opacity-90 flex-1"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                color: "white",
              }}
              data-ocid="settings.link"
            >
              <BarChart3 className="w-4 h-4" />
              View Cycle Balance on IC Dashboard
            </a>
          )}
        </div>
      </div>

      {/* Top Up Cycles */}
      <div className="capsule-card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4" style={{ color: "oklch(0.67 0.18 230)" }} />
          <h3 className="font-display font-semibold text-foreground">
            Top Up Cycles
          </h3>
        </div>

        {/* Critical warning — do NOT send ICP directly */}
        <Alert
          className="border-amber-500/40 rounded-xl"
          style={{ background: "oklch(0.75 0.18 85 / 0.08)" }}
          data-ocid="settings.error_state"
        >
          <AlertTriangle
            className="h-4 w-4"
            style={{ color: "oklch(0.75 0.18 85)" }}
          />
          <AlertDescription
            className="text-sm leading-relaxed"
            style={{ color: "oklch(0.85 0.12 85)" }}
          >
            <span className="font-semibold">Important:</span> Do{" "}
            <span className="font-semibold underline">not</span> send ICP
            directly to your Canister ID as a regular transfer — it will not add
            cycles and the ICP will not be recoverable. You must use the NNS{" "}
            <span className="font-semibold">"Add Cycles"</span> flow described
            below, which is the only correct way to top up.
          </AlertDescription>
        </Alert>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-gradient-sky border-0 text-white hover:opacity-90 transition-opacity w-full sm:w-auto"
              data-ocid="settings.open_modal_button"
            >
              <Zap className="w-4 h-4" />
              How to Top Up Cycles
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-lg"
            style={{
              background: "oklch(0.15 0.04 265)",
              border: "1px solid oklch(0.26 0.05 265)",
            }}
            data-ocid="settings.dialog"
          >
            <DialogHeader>
              <DialogTitle className="font-display text-lg text-gradient-sky flex items-center gap-2">
                <Zap
                  className="w-5 h-5"
                  style={{ color: "oklch(0.67 0.18 230)" }}
                />
                Top Up Your Capsule Cycles
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                Use the NNS app to convert ICP into cycles for your canister.
                Follow the steps below carefully.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Warning inside dialog */}
              <div
                className="rounded-lg px-4 py-3 flex items-start gap-3"
                style={{
                  background: "oklch(0.75 0.18 85 / 0.10)",
                  border: "1px solid oklch(0.75 0.18 85 / 0.35)",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "oklch(0.75 0.18 85)" }}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "oklch(0.85 0.12 85)" }}
                >
                  <span className="font-semibold">Do not use "Send ICP."</span>{" "}
                  You must use the{" "}
                  <span className="font-semibold">"Add Cycles"</span> option
                  inside "My Canisters" — that's the only flow that converts ICP
                  to cycles.
                </p>
              </div>

              {/* Canister ID */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Your Canister ID
                </p>
                {canisterLoading ? (
                  <Skeleton className="h-12 rounded-lg" />
                ) : (
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 text-xs font-mono text-foreground break-all p-3 rounded-lg"
                      style={{ background: "oklch(0.17 0.045 265 / 0.8)" }}
                    >
                      {canisterId ??
                        (canisterError
                          ? "Error loading — please refresh"
                          : "Not available")}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={handleCopyCanisterInDialog}
                      disabled={!canisterId}
                      data-ocid="settings.copy_canister_id_button"
                      title="Copy Canister ID"
                    >
                      {copiedCanisterInDialog ? (
                        <CheckCheck
                          className="w-4 h-4"
                          style={{ color: "oklch(0.67 0.18 230)" }}
                        />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Step-by-step instructions — NNS "Add Cycles" flow */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">
                  Steps to add cycles via NNS:
                </p>
                <ol className="space-y-2 list-none">
                  {(
                    [
                      "Copy your Canister ID above",
                      'Open the NNS app and go to "My Canisters" in the left sidebar',
                      'If your canister isn\'t listed, click "Link Canister" and paste your Canister ID',
                      'Click on your canister, then click "Add Cycles" — NOT "Send ICP"',
                      "Enter the amount of ICP to convert — it will be automatically converted to cycles for your canister",
                    ] as const
                  ).map((step, i) => (
                    <li key={step} className="flex items-start gap-2.5">
                      <span
                        className="flex-shrink-0 w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold mt-0.5"
                        style={{
                          background: "oklch(0.67 0.18 230 / 0.15)",
                          color: "oklch(0.72 0.18 225)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-col gap-2">
                <a
                  href="https://nns.ic0.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-10 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                    color: "white",
                  }}
                  data-ocid="settings.link"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open NNS App
                </a>
                {canisterId && (
                  <a
                    href={`https://dashboard.internetcomputer.org/canister/${canisterId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-10 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 border"
                    style={{
                      borderColor: "oklch(0.67 0.18 230 / 0.4)",
                      color: "oklch(0.72 0.18 225)",
                    }}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Check Cycle Balance on IC Dashboard
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
