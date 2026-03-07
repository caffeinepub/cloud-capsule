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
  Activity,
  CheckCheck,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  User,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";
import { useGetCanisterId, useGetCycleBalance } from "../../hooks/useQueries";
import { formatCycleBalance } from "../../utils/crypto";

interface SettingsTabProps {
  userProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export default function SettingsTab({
  userProfile,
  onSaveProfile,
}: SettingsTabProps) {
  const {
    data: cycleBalance,
    isLoading: cyclesLoading,
    refetch: refetchCycles,
    isFetching: cyclesFetching,
  } = useGetCycleBalance();
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
  const [icpAmount, setIcpAmount] = useState("1");

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

  const cyclePercent =
    cycleBalance != null
      ? Math.min(100, (Number(cycleBalance) / 10_000_000_000_000) * 100)
      : 0;

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

      {/* Cycle balance */}
      <div className="capsule-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity
              className="w-4 h-4"
              style={{ color: "oklch(0.67 0.18 230)" }}
            />
            <h3 className="font-display font-semibold text-foreground">
              Cycle Balance
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetchCycles()}
            disabled={cyclesFetching}
            className="h-7 gap-1.5 text-xs text-muted-foreground"
            data-ocid="settings.secondary_button"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${cyclesFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {cyclesLoading ? (
          <Skeleton
            className="h-16 rounded-xl"
            data-ocid="settings.loading_state"
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold text-foreground">
                {cycleBalance != null ? formatCycleBalance(cycleBalance) : "—"}
              </span>
            </div>

            {/* Progress bar */}
            {cycleBalance != null && (
              <div className="space-y-1">
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: "oklch(0.22 0.04 265)" }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cyclePercent}%`,
                      background:
                        cyclePercent < 20
                          ? "oklch(0.577 0.245 27.325)"
                          : "linear-gradient(90deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {cyclePercent < 20
                    ? "⚠️ Low cycle balance — consider topping up"
                    : "Cycle balance looks healthy"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canister ID */}
      <div className="capsule-card p-6 space-y-4">
        <h3 className="font-display font-semibold text-foreground">
          Canister ID
        </h3>
        {canisterLoading ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : (
          <div className="flex items-center gap-2">
            <code
              className="flex-1 text-xs font-mono text-foreground break-all p-3 rounded-lg"
              style={{ background: "oklch(0.17 0.045 265 / 0.6)" }}
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

      {/* Top Up Cycles */}
      <div className="capsule-card p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4" style={{ color: "oklch(0.67 0.18 230)" }} />
          <h3 className="font-display font-semibold text-foreground">
            Top Up Cycles
          </h3>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Keep your capsule funded to ensure your memories and messages are
          always accessible to your loved ones. Typical storage costs are very
          low — a small amount of ICP can last years.
        </p>

        <div className="space-y-2">
          <Label htmlFor="icp-amount">ICP Amount (for reference)</Label>
          <Input
            id="icp-amount"
            type="number"
            min="0.5"
            step="0.1"
            value={icpAmount}
            onChange={(e) => setIcpAmount(e.target.value)}
            placeholder="1.0"
            className="max-w-[180px]"
            data-ocid="settings.input"
          />
          <p className="text-xs text-muted-foreground">
            Enter the amount you plan to send as a reference.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="gap-2 bg-gradient-sky border-0 text-white hover:opacity-90 transition-opacity"
              data-ocid="settings.open_modal_button"
            >
              <Zap className="w-4 h-4" />
              How to Top Up
            </Button>
          </DialogTrigger>
          <DialogContent
            className="max-w-md"
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
                Top Up Your Capsule
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed">
                To add cycles to your capsule, send ICP directly to your
                Canister ID using the NNS app or any compatible ICP wallet.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {icpAmount && Number(icpAmount) > 0 && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    background: "oklch(0.67 0.18 230 / 0.08)",
                    border: "1px solid oklch(0.67 0.18 230 / 0.2)",
                  }}
                >
                  <p className="text-foreground">
                    You plan to send{" "}
                    <span className="font-semibold text-gradient-sky">
                      {icpAmount} ICP
                    </span>{" "}
                    to your canister.
                  </p>
                </div>
              )}

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

              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Steps to top up:</p>
                <ol className="space-y-1.5 list-none">
                  {[
                    "Copy your Canister ID above",
                    "Open the NNS app and go to your ICP account",
                    'Select "Send" and paste your Canister ID as the destination',
                    "Enter the ICP amount and confirm the transaction",
                  ].map((step, i) => (
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
