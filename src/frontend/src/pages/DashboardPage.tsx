import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@dfinity/principal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Brain,
  Cloud,
  FileText,
  Heart,
  Image,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import AccessTab from "../components/dashboard/AccessTab";
import BeneficiariesTab from "../components/dashboard/BeneficiariesTab";
import MediaTab from "../components/dashboard/MediaTab";
import NeuronsTab from "../components/dashboard/NeuronsTab";
import NotesTab from "../components/dashboard/NotesTab";
import OnboardingModal from "../components/dashboard/OnboardingModal";
import SettingsTab from "../components/dashboard/SettingsTab";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCapsule,
  useGetCallerUserProfile,
  useGetCapsuleLockStatus,
  useSaveCallerUserProfile,
  useToggleCapsuleLock,
} from "../hooks/useQueries";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const ownerPrincipal: Principal | null = identity
    ? (identity.getPrincipal() as unknown as Principal)
    : null;

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const { data: capsuleLocked = true } =
    useGetCapsuleLockStatus(ownerPrincipal);
  const saveProfile = useSaveCallerUserProfile();
  const createCapsule = useCreateCapsule();
  const toggleLock = useToggleCapsuleLock();

  // Inline create capsule state
  const [showInlineCreate, setShowInlineCreate] = useState(false);
  const [inlineName, setInlineName] = useState("");
  const [inlineError, setInlineError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  // Show onboarding when the profile query has fully settled (isFetched) and
  // returned null — meaning this is a brand new user with no capsule yet.
  // Using isFetched (instead of isSuccess) ensures the banner appears even when
  // the actor takes a moment to initialize, since isFetched is true after the
  // query completes regardless of success/error.
  const showOnboarding =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  // Whether to show the inline "Create Your Capsule" banner (confirmed no profile)
  const showCreateBanner = showOnboarding && !showInlineCreate;

  // Tab content renders for any authenticated user — individual tab components
  // handle their own loading skeletons and empty states. The old profile-based
  // guard was causing blank tabs when isFetched flipped due to actor race conditions.
  const capsuleReady = isAuthenticated;

  const handleToggleLock = async () => {
    try {
      await toggleLock.mutateAsync();
    } catch {
      // handled by toast
    }
  };

  const handleInlineCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineName.trim()) {
      setInlineError("Please enter your name");
      return;
    }
    setInlineError("");
    await createCapsule.mutateAsync();
    await saveProfile.mutateAsync({ name: inlineName.trim() });
    setShowInlineCreate(false);
  };

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: "/" });
  };

  if (isInitializing || (!isAuthenticated && !isInitializing)) {
    return (
      <div className="min-h-screen bg-space flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space flex flex-col">
      {/* Top bar */}
      <motion.header
        className="sticky top-0 z-20 border-b border-border/60 backdrop-blur-sm"
        style={{ background: "oklch(0.13 0.04 265 / 0.92)" }}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo + title */}
          <div className="flex items-center gap-3">
            <img
              src="/assets/uploads/4FFBD3E5-2A6D-4DA4-B19E-16EFB7B05C9D-1.png"
              alt="Cloud Capsule"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="font-display text-base font-semibold leading-none text-gradient-sky">
                Cloud Capsule
              </h1>
              {userProfile?.name && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {userProfile.name}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-1.5 text-xs text-muted-foreground"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Dashboard content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        {/* Create Your Capsule Banner — shown when no capsule exists yet */}
        <AnimatePresence>
          {showCreateBanner && (
            <motion.div
              data-ocid="create_capsule.panel"
              key="create-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mb-6 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.17 0.05 265 / 0.85), oklch(0.19 0.06 280 / 0.85))",
                border: "1px solid oklch(0.67 0.18 230 / 0.35)",
                boxShadow: "0 0 24px oklch(0.67 0.18 230 / 0.12)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                  }}
                >
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gradient-sky">
                    You don't have a capsule yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create your personal legacy vault on the Internet Computer.
                  </p>
                </div>
              </div>
              <Button
                data-ocid="create_capsule.open_modal_button"
                onClick={() => setShowInlineCreate(true)}
                className="shrink-0 gap-2 text-white font-semibold glow-sky"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                }}
              >
                <Heart className="w-4 h-4" />
                Create Your Capsule
              </Button>
            </motion.div>
          )}

          {/* Inline create form */}
          {showInlineCreate && (
            <motion.div
              data-ocid="create_capsule.modal"
              key="create-form"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="mb-6 rounded-xl p-6 space-y-4"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.17 0.05 265 / 0.9), oklch(0.19 0.06 280 / 0.9))",
                border: "1px solid oklch(0.67 0.18 230 / 0.35)",
                boxShadow: "0 0 24px oklch(0.67 0.18 230 / 0.12)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                  }}
                >
                  <Cloud className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-base font-semibold text-gradient-sky">
                    Create Your Capsule
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Your private legacy vault on the Internet Computer.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInlineCreate} className="space-y-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="inline-name"
                    className="text-sm font-medium text-foreground"
                  >
                    Your Name
                  </label>
                  <input
                    data-ocid="create_capsule.input"
                    id="inline-name"
                    value={inlineName}
                    onChange={(e) => setInlineName(e.target.value)}
                    placeholder="How should your loved ones know you?"
                    disabled={createCapsule.isPending || saveProfile.isPending}
                    className="w-full h-10 rounded-lg px-3 text-sm bg-background/50 border border-border focus:outline-none focus:ring-2 focus:ring-sky-500/40 text-foreground placeholder:text-muted-foreground"
                  />
                  {inlineError && (
                    <p className="text-xs text-destructive">{inlineError}</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-1">
                  <Button
                    data-ocid="create_capsule.cancel_button"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowInlineCreate(false);
                      setInlineName("");
                      setInlineError("");
                    }}
                    disabled={createCapsule.isPending || saveProfile.isPending}
                    className="text-muted-foreground"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="create_capsule.submit_button"
                    type="submit"
                    size="sm"
                    className="gap-2 text-white font-semibold glow-sky"
                    disabled={
                      createCapsule.isPending ||
                      saveProfile.isPending ||
                      !inlineName.trim()
                    }
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.67 0.18 230), oklch(0.58 0.22 285))",
                    }}
                  >
                    {createCapsule.isPending || saveProfile.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Heart className="w-3.5 h-3.5" />
                        Create My Capsule
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs defaultValue="notes" className="w-full">
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
                { value: "media", icon: Image, label: "Media" },
                { value: "neurons", icon: Brain, label: "Neurons" },
                { value: "beneficiaries", icon: Users, label: "Beneficiaries" },
                { value: "settings", icon: Settings, label: "Settings" },
                { value: "access", icon: ShieldCheck, label: "Access" },
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

          <TabsContent value="notes" className="mt-0">
            {capsuleReady && ownerPrincipal && (
              <NotesTab ownerPrincipal={ownerPrincipal} />
            )}
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            {capsuleReady && ownerPrincipal && (
              <MediaTab ownerPrincipal={ownerPrincipal} />
            )}
          </TabsContent>

          <TabsContent value="neurons" className="mt-0">
            {capsuleReady && ownerPrincipal && (
              <NeuronsTab ownerPrincipal={ownerPrincipal} />
            )}
          </TabsContent>

          <TabsContent value="beneficiaries" className="mt-0">
            {capsuleReady && <BeneficiariesTab />}
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsTab
              userProfile={userProfile ?? null}
              onSaveProfile={async (profile) => {
                await saveProfile.mutateAsync(profile);
              }}
            />
          </TabsContent>

          <TabsContent value="access" className="mt-0">
            <AccessTab
              capsuleLocked={capsuleLocked}
              onToggle={handleToggleLock}
              isToggling={toggleLock.isPending}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding modal is no longer the primary entry point —
          the inline banner above the tabs handles capsule creation.
          Kept here as a safety net only (should never trigger in practice). */}
    </div>
  );
}
