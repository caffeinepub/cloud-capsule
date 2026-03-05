import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@dfinity/principal";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Brain,
  FileText,
  Image,
  Loader2,
  Lock,
  LogOut,
  Settings,
  Unlock,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
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
  useSaveCallerUserProfile,
  useToggleCapsuleLock,
} from "../hooks/useQueries";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const isAuthenticated = !!identity;
  const [capsuleLocked, setCapsuleLocked] = useState(true);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const createCapsule = useCreateCapsule();
  const toggleLock = useToggleCapsuleLock();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  const showOnboarding =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;

  const ownerPrincipal: Principal | null = identity
    ? (identity.getPrincipal() as unknown as Principal)
    : null;

  const handleToggleLock = async () => {
    try {
      await toggleLock.mutateAsync();
      setCapsuleLocked((prev) => !prev);
    } catch {
      // handled by toast
    }
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
              src="/assets/generated/cloud-capsule-logo-transparent.png"
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

          {/* Lock toggle + actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 text-xs py-1 px-2.5"
                style={{
                  borderColor: capsuleLocked
                    ? "oklch(0.67 0.18 230 / 0.4)"
                    : "oklch(0.58 0.22 285 / 0.4)",
                  color: capsuleLocked
                    ? "oklch(0.72 0.18 225)"
                    : "oklch(0.72 0.18 285)",
                  background: capsuleLocked
                    ? "oklch(0.67 0.18 230 / 0.08)"
                    : "oklch(0.58 0.22 285 / 0.08)",
                }}
              >
                {capsuleLocked ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  <Unlock className="w-3 h-3" />
                )}
                {capsuleLocked ? "Locked" : "Unlocked"}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleLock}
              disabled={toggleLock.isPending}
              data-ocid="dashboard.lock_toggle"
              className="gap-1.5 text-xs"
            >
              {toggleLock.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : capsuleLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Lock
                </>
              )}
            </Button>

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
            {ownerPrincipal && <NotesTab ownerPrincipal={ownerPrincipal} />}
          </TabsContent>

          <TabsContent value="media" className="mt-0">
            {ownerPrincipal && <MediaTab ownerPrincipal={ownerPrincipal} />}
          </TabsContent>

          <TabsContent value="neurons" className="mt-0">
            {ownerPrincipal && <NeuronsTab ownerPrincipal={ownerPrincipal} />}
          </TabsContent>

          <TabsContent value="beneficiaries" className="mt-0">
            <BeneficiariesTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-0">
            <SettingsTab
              userProfile={userProfile ?? null}
              onSaveProfile={async (profile) => {
                await saveProfile.mutateAsync(profile);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={async (name) => {
            await createCapsule.mutateAsync();
            await saveProfile.mutateAsync({ name });
          }}
          isLoading={createCapsule.isPending || saveProfile.isPending}
        />
      )}
    </div>
  );
}
