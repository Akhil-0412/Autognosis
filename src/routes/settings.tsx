import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useUser, UserProfile } from "@clerk/clerk-react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "System Settings — Autognosis Operator Console" },
      {
        name: "description",
        content:
          "Configure your Autognosis operator profile, alert preferences and developer API keys for the telemetry engine.",
      },
      { property: "og:title", content: "System Settings — Autognosis Operator Console" },
      {
        property: "og:description",
        content: "Manage operator profile, notification preferences and API access.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const TABS = [
  { id: "profile", label: "Profile", icon: "person" },
  { id: "notifications", label: "Notifications", icon: "notifications_active" },
  { id: "api", label: "API", icon: "api" },
] as const;

function Toggle({
  value,
  onChange,
  critical = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  critical?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="relative z-10 h-6 w-12 flex-shrink-0 rounded-full bg-surface-container-high transition-colors duration-300"
    >
      <span
        className={cn(
          "absolute top-1 left-1 h-4 w-4 rounded-full transition-all duration-300",
          value
            ? critical
              ? "translate-x-6 bg-critical"
              : "translate-x-6 bg-plasma"
            : "bg-muted",
        )}
      />
    </button>
  );
}

function SettingsPage() {
  const { user } = useUser();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("profile");
  const [alerts, setAlerts] = useState({ realtime: true, digest: false, critical: true });
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState("sk_live_948fbc20e98a21fc7710a39");
  const [displayName, setDisplayName] = useState("System Admin");
  const [email, setEmail] = useState("operator@autognosis.sys");
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.fullName) setDisplayName(user.fullName);
      if (user.primaryEmailAddress?.emailAddress) {
        setEmail(user.primaryEmailAddress.emailAddress);
      }
    }
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    if (confirm("Regenerating this API key will invalidate existing webhook connections. Proceed?")) {
      const newKey = "sk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setApiKey(newKey);
      alert("New API Key generated successfully!");
    }
  };

  const handleSaveProfile = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  return (
    <AppShell active="/settings" search>
      <div className="mx-auto max-w-5xl px-margin-mobile py-8 md:px-margin-desktop">
        <header className="mb-stack-lg">
          <h1 className="font-display text-headline-md text-text md:text-headline-lg">
            System Settings
          </h1>
          <p className="mt-2 text-body-md text-muted">
            Configure your dashboard preferences, operator profile, and external integrations.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-gutter md:grid-cols-12">
          <div className="md:col-span-3">
            <nav className="glass-panel sticky top-24 flex flex-col gap-1 p-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left font-terminal text-label-md transition-colors duration-200",
                    tab === t.id
                      ? "border border-line bg-surface-container-high text-plasma"
                      : "text-muted hover:text-ion",
                  )}
                >
                  <Icon name={t.icon} />
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="md:col-span-9">
            {tab === "profile" && (
              <div className="glass-panel p-panel-padding">
                <h2 className="mb-6 font-display text-headline-sm text-text">Operator Profile</h2>
                <div className="mb-8 flex flex-col items-start gap-8 sm:flex-row">
                  <div className="group relative">
                    {/* Human Silhouette Shadow Avatar */}
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-plasma/50 bg-gradient-to-b from-surface-container-high via-surface to-deep shadow-[0_0_25px_rgba(33,118,255,0.35)] transition-all group-hover:border-plasma">
                      {user?.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt="Operator avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Icon name="person" className="text-5xl text-plasma/80" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 font-terminal text-label-sm text-plasma">AUTHENTICATED IDENTITY</p>
                    <p className="mb-1 font-display text-lg text-text">
                      {user ? user.fullName || "Authenticated Operator" : "Local Controller Account"}
                    </p>
                    <p className="text-body-sm text-muted">
                      {user ? `Managed via Clerk Auth (${email})` : "Sign in via the top bar to synchronize your fleet profile across devices."}
                    </p>
                  </div>
                </div>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div>
                    <label className="mb-2 block font-terminal text-label-sm text-muted">
                      DISPLAY NAME
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full rounded-sm border border-line bg-deep px-4 py-3 font-terminal text-body-md text-text focus:border-plasma focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-terminal text-label-sm text-muted">
                      EMAIL ADDRESS
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="w-full cursor-not-allowed rounded-sm border border-line bg-surface-container-low px-4 py-3 font-terminal text-body-md text-muted opacity-70"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    {savedMsg ? (
                      <span className="font-terminal text-label-sm text-safe">
                        ✓ Profile settings saved successfully.
                      </span>
                    ) : <span />}
                    <button
                      type="submit"
                      className="plasma-pulse rounded-sm bg-plasma px-6 py-2 font-terminal text-label-md font-semibold text-white shadow-[0_0_15px_rgba(33,118,255,0.4)]"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {tab === "notifications" && (
              <div className="glass-panel p-panel-padding">
                <h2 className="mb-6 font-display text-headline-sm text-text">Alert Routing</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-line bg-deep p-4">
                    <div>
                      <h3 className="text-body-md font-medium text-text">Realtime Telemetry</h3>
                      <p className="mt-1 text-body-sm text-muted">
                        Live sensor deviations pushed to your console.
                      </p>
                    </div>
                    <Toggle
                      value={alerts.realtime}
                      onChange={(v) => setAlerts((a) => ({ ...a, realtime: v }))}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-deep p-4">
                    <div>
                      <h3 className="text-body-md font-medium text-text">Weekly Digest</h3>
                      <p className="mt-1 text-body-sm text-muted">
                        Summary of fleet health and AI interventions.
                      </p>
                    </div>
                    <Toggle
                      value={alerts.digest}
                      onChange={(v) => setAlerts((a) => ({ ...a, digest: v }))}
                    />
                  </div>
                  <div className="relative flex items-center justify-between overflow-hidden rounded-lg border border-critical/30 bg-deep p-4">
                    <div className="pointer-events-none absolute inset-0 bg-critical/5" />
                    <div className="relative z-10">
                      <h3 className="flex items-center gap-2 text-body-md font-medium text-text">
                        <Icon name="warning" className="text-sm text-critical" />
                        Critical Faults
                      </h3>
                      <p className="mt-1 text-body-sm text-muted">
                        Immediate push notification for hazard states.
                      </p>
                    </div>
                    <Toggle
                      critical
                      value={alerts.critical}
                      onChange={(v) => setAlerts((a) => ({ ...a, critical: v }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "api" && (
              <div className="glass-panel p-panel-padding">
                <h2 className="mb-6 font-display text-headline-sm text-text">Developer API</h2>
                <div className="mb-8 rounded-lg border border-line bg-surface-container-low p-4">
                  <p className="mb-4 text-body-sm text-muted">
                    Use this key to authenticate external systems with the Autognosis telemetry
                    engine.
                  </p>
                  <label className="mb-2 block font-terminal text-label-sm text-muted">
                    API KEY
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        readOnly
                        type="text"
                        value={apiKey}
                        className={cn(
                          "w-full rounded-sm border border-line bg-deep py-3 pr-10 pl-4 font-terminal text-body-md tracking-widest text-plasma transition-all outline-none",
                          !revealed && "blur-[4px]",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setRevealed((r) => !r)}
                        aria-label="Toggle API key visibility"
                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-text"
                      >
                        <Icon name={revealed ? "visibility_off" : "visibility"} className="text-sm" />
                      </button>
                    </div>
                    <button
                      onClick={handleCopy}
                      title="Copy to clipboard"
                      className="rounded-sm border border-line bg-glass px-4 text-muted transition-colors hover:border-plasma hover:text-plasma active:scale-95"
                    >
                      <Icon name={copied ? "check" : "content_copy"} className={copied ? "text-safe" : ""} />
                    </button>
                  </div>
                  {copied && (
                    <p className="mt-2 font-terminal text-xs text-safe">✓ Copied to clipboard!</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
                  <p className="font-terminal text-label-sm text-muted">Status: Active (Full Telemetry Access)</p>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-2 rounded-sm border border-hazard bg-glass px-4 py-2 font-terminal text-label-md text-hazard transition-colors hover:bg-hazard/10 active:scale-95"
                  >
                    <Icon name="refresh" className="text-sm" />
                    Regenerate Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
