import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Heart, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface OnboardingModalProps {
  onComplete: (name: string) => Promise<void>;
  isLoading: boolean;
}

export default function OnboardingModal({
  onComplete,
  isLoading,
}: OnboardingModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    await onComplete(name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "oklch(0.14 0.025 50 / 0.6)",
        backdropFilter: "blur(8px)",
      }}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.4,
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <div
          className="capsule-card p-8 space-y-6"
          style={{ background: "oklch(0.99 0.006 80)" }}
        >
          {/* Icon */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-warm"
              style={{ background: "oklch(0.52 0.12 62)" }}
            >
              <Cloud className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-foreground">
                Create Your Capsule
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Welcome to Cloud Capsule. Let's set up your personal legacy
                vault on the Internet Computer.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Your Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should your loved ones know you?"
                disabled={isLoading}
                autoFocus
                className="h-11"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>

            <div
              className="rounded-lg p-4 text-sm space-y-1.5"
              style={{
                background: "oklch(0.52 0.12 62 / 0.06)",
                border: "1px solid oklch(0.52 0.12 62 / 0.2)",
              }}
            >
              <p
                className="font-medium"
                style={{ color: "oklch(0.42 0.1 60)" }}
              >
                What happens next:
              </p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>✦ Your private capsule canister is created</li>
                <li>✦ Only you control what gets stored</li>
                <li>✦ You decide when beneficiaries can access it</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full h-11 gap-2"
              disabled={isLoading || !name.trim()}
              style={{
                background: "oklch(0.52 0.12 62)",
                color: "oklch(0.99 0.006 80)",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Capsule...
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4" />
                  Create My Capsule
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
