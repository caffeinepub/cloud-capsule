import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCheck, Loader2, Lock, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "../../backend.d";

interface SettingsTabProps {
  userProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => Promise<void>;
}

export default function SettingsTab({
  userProfile,
  onSaveProfile,
}: SettingsTabProps) {
  const [profileName, setProfileName] = useState(userProfile?.name ?? "");
  const [profileDirty, setProfileDirty] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile?.name) setProfileName(userProfile.name);
  }, [userProfile?.name]);

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

      {/* Infrastructure & Privacy */}
      <div className="capsule-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield
            className="w-4 h-4"
            style={{ color: "oklch(0.67 0.18 230)" }}
          />
          <h3 className="font-display font-semibold text-foreground">
            Your Data &amp; Privacy
          </h3>
        </div>

        <div
          className="rounded-xl px-4 py-4 flex items-start gap-3"
          style={{
            background: "oklch(0.67 0.18 230 / 0.07)",
            border: "1px solid oklch(0.67 0.18 230 / 0.18)",
          }}
        >
          <Lock
            className="w-4 h-4 mt-0.5 flex-shrink-0"
            style={{ color: "oklch(0.67 0.18 230)" }}
          />
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-medium text-foreground">
              Powered by the Internet Computer.
            </span>{" "}
            Cloud Capsule runs on the Internet Computer blockchain. Your notes,
            media, and neuron instructions are stored on-chain and accessible
            only to you and the beneficiaries you designate. Infrastructure and
            cycle costs are managed automatically — you don't need to do
            anything to keep your capsule running.
          </p>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          No one — including the app developers — can read, modify, or delete
          your capsule content. Access is controlled entirely by your Internet
          Identity and the beneficiary credentials you set up.
        </p>
      </div>
    </div>
  );
}
