import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { VehicleModal } from "@/components/VehicleModal";
import {
  getActiveVehicles,
  getActiveVehicle,
  setActiveVehicleId,
  type Vehicle,
} from "@/lib/vehicles";
import {
  getDailyUsage,
  recordPromptUsage,
  getTimeUntilMidnight,
  type DailyUsage,
} from "@/lib/usage";
import { getApiUrl } from "@/lib/api";

export const Route = createFileRoute("/ai-mechanic")({
  component: AiMechanicPage,
  head: () => ({
    meta: [
      { title: "Sparky AI Mechanic — Live Vehicle Diagnosis" },
      {
        name: "description",
        content:
          "Chat with Sparky, the Autognosis AI mechanic. Describe symptoms or connect an OBD2 scanner for live fault analysis.",
      },
      { property: "og:title", content: "Sparky AI Mechanic — Live Vehicle Diagnosis" },
      {
        property: "og:description",
        content: "Describe symptoms or connect an OBD2 scanner for instant AI fault analysis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

type Message =
  | { role: "system"; text: string }
  | { role: "user"; text: string; time: string }
  | {
      role: "sparky";
      text: string;
      suggestions?: string[];
      video_link?: string | null;
      video_label?: string | null;
    };

function AiMechanicPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeVeh, setActiveVeh] = useState<Vehicle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDiagnosis, setActiveDiagnosis] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [usage, setUsage] = useState<DailyUsage>(getDailyUsage());
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  const initVehicles = () => {
    const list = getActiveVehicles();
    setVehicles(list);
    const curr = getActiveVehicle();
    setActiveVeh(curr);

    if (curr) {
      setMessages([
        { role: "system", text: `[SYSTEM_INIT] CONNECTED TO ${curr.year} ${curr.make.toUpperCase()} ${curr.model.toUpperCase()} (OBD2 LINK ESTABLISHED)` },
        {
          role: "sparky",
          text: `Hey! I'm Sparky 🛠️, your AI mechanic. I'm connected to your **${curr.year} ${curr.make} ${curr.model}** (${curr.plate}) with **${curr.mileage.toLocaleString()} miles**.\n\nTell me what's going on (weird sounds, warning lights, vibrations, or maintenance questions) and let's get it diagnosed!`,
          suggestions: curr.issueDescription
            ? [`Diagnose symptom: "${curr.issueDescription}"`, "What's the estimated repair cost?", "Is it safe to drive?"]
            : ["Engine light is on with a rattling noise", "Brakes squeaking at low speed", "When is my next transmission service due?"],
        },
      ]);
    } else {
      setMessages([
        { role: "system", text: "[SYSTEM_INIT] NO VEHICLES REGISTERED" },
        {
          role: "sparky",
          text: "Hey! I'm Sparky 🛠️, your AI mechanic buddy. You don't have any vehicles registered yet. Click 'Register Vehicle' at the top or register one now so I know what car we're working on!",
          suggestions: ["How does Autognosis AI diagnose cars?", "Show supported OBD2 protocols"],
        },
      ]);
    }
  };

  useEffect(() => {
    initVehicles();
    setUsage(getDailyUsage());

    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
      setUsage(getDailyUsage());
    }, 1000);

    const handleUpdate = () => {
      const list = getActiveVehicles();
      setVehicles(list);
      const curr = getActiveVehicle();
      setActiveVeh(curr);
      setUsage(getDailyUsage());
    };

    window.addEventListener("autognosis_active_vehicle_changed", handleUpdate);
    window.addEventListener("autognosis_vehicles_changed", handleUpdate);
    window.addEventListener("autognosis_mode_changed", handleUpdate);
    window.addEventListener("autognosis_usage_updated", handleUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("autognosis_active_vehicle_changed", handleUpdate);
      window.removeEventListener("autognosis_vehicles_changed", handleUpdate);
      window.removeEventListener("autognosis_mode_changed", handleUpdate);
      window.removeEventListener("autognosis_usage_updated", handleUpdate);
    };
  }, []);

  const handleSwitchVehicle = (vehId: string) => {
    setActiveVehicleId(vehId);
    const target = vehicles.find((v) => v.id === vehId);
    if (target) {
      setActiveVeh(target);
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          text: `[TELEMETRY_SWITCH] DIAGNOSTIC CONTEXT SWITCHED TO ${target.year} ${target.make} ${target.model} (${target.plate})`,
        },
        {
          role: "sparky",
          text: `Switched focus to your **${target.year} ${target.make} ${target.model}** (${target.plate}) with **${target.mileage.toLocaleString()} mi**.\n\nWhat would you like to inspect or troubleshoot on this vehicle?`,
          suggestions: target.issueDescription
            ? [`Investigate: "${target.issueDescription}"`, "Check maintenance schedule", "Estimated repair cost?"]
            : ["Perform full diagnostics scan", "Check brake & tire wear", "Review recent sensor telemetry"],
        },
      ]);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const value = (textToSend ?? draft).trim();
    if (!value || loading) return;

    // Record prompt usage and reset check
    recordPromptUsage(180);

    const now = new Date();
    const userTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { role: "user", text: value, time: userTime };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setDraft("");
    setLoading(true);

    try {
      const historyPayload = newHistory
        .filter((m) => m.role === "user" || m.role === "sparky")
        .map((m) => ({
          role: m.role === "user" ? "user" : "bot",
          content: m.text,
        }));

      const res = await fetch(getApiUrl("/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: value,
          make: activeVeh ? activeVeh.make : "Generic",
          model: activeVeh ? activeVeh.model : "Vehicle",
          year: activeVeh ? activeVeh.year : 2022,
          mileage: activeVeh ? activeVeh.mileage : 35000,
          history: historyPayload.slice(0, -1),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const sparkyReply: Message = {
        role: "sparky",
        text: data.response || "Logged. Running diagnostic simulations for your vehicle.",
        suggestions: data.suggestions && data.suggestions.length > 0 ? data.suggestions : undefined,
        video_link: data.video_link,
        video_label: data.video_label,
      };

      setMessages((prev) => [...prev, sparkyReply]);
      setActiveDiagnosis(value);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "sparky",
          text: `Logged symptom: "${value}". Based on standard service bulletins for the ${activeVeh ? activeVeh.make + " " + activeVeh.model : "vehicle"}, let's inspect the sensor logs and mechanical components.`,
          suggestions: ["Check brake & rotor wear", "Engine vibration under load", "Inspect exhaust heat shield"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const lastSparky = [...messages].reverse().find((m) => m.role === "sparky");
  const currentSuggestions = lastSparky && "suggestions" in lastSparky && lastSparky.suggestions ? lastSparky.suggestions : [];

  return (
    <AppShell active="/ai-mechanic">
      <div className="mx-auto flex max-w-7xl flex-col gap-gutter p-margin-mobile md:h-[calc(100vh-170px)] md:flex-row md:p-margin-desktop">
        <section className="glass-panel flex h-[calc(100vh-240px)] flex-col overflow-hidden md:h-full md:flex-[0_0_63%]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-container-low p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-plasma/20 text-plasma shadow-[0_0_15px_rgba(33,118,255,0.3)]">
                <Icon name="directions_car" className="text-2xl" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-headline-sm text-text">
                    {activeVeh ? `${activeVeh.year} ${activeVeh.make} ${activeVeh.model}` : "No Active Vehicle"}
                  </h1>
                  {activeVeh ? (
                    <span className="rounded-sm border border-yellow-500/80 bg-yellow-400/90 px-2 py-0.5 font-terminal text-xs font-bold text-black">
                      {activeVeh.plate}
                    </span>
                  ) : null}
                </div>
                <span className="font-terminal text-label-sm text-muted">
                  {activeVeh ? `Odometer: ${activeVeh.mileage.toLocaleString()} mi` : "Select or add a vehicle to begin"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Daily Token / Prompt Quota HUD */}
              <div className="hidden items-center gap-1.5 rounded-full border border-plasma/40 bg-plasma/10 px-3 py-1 font-terminal text-xs text-plasma sm:inline-flex shadow-[0_0_10px_rgba(33,118,255,0.2)]">
                <span className="h-2 w-2 rounded-full bg-plasma animate-pulse" />
                <span>Today: <strong>{usage.promptsUsed}</strong> prompts • Resets in <strong>{countdown.formatted}</strong></span>
              </div>

              {vehicles.length > 1 ? (
                <select
                  value={activeVeh?.id || ""}
                  onChange={(e) => handleSwitchVehicle(e.target.value)}
                  className="rounded-lg border border-line bg-deep px-3 py-1.5 font-terminal text-label-sm text-text focus:border-plasma focus:outline-none"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} ({v.plate})
                    </option>
                  ))}
                </select>
              ) : null}

              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-1.5 font-terminal text-label-sm text-plasma hover:border-plasma hover:bg-surface-container"
              >
                <Icon name="add" className="text-xs" /> Add Vehicle
              </button>

              <div className="hidden items-center gap-1.5 rounded-full border border-safe/40 bg-safe/10 px-2.5 py-1 font-terminal text-label-sm text-safe sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-safe" />
                <span>SPARKY ACTIVE</span>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col space-y-6 overflow-y-auto p-6">
            {messages.map((m, i) => {
              if (m.role === "system") {
                return (
                  <div
                    key={i}
                    className="self-center rounded-md border border-line bg-surface-container px-3 py-1 font-terminal text-terminal text-muted"
                  >
                    {m.text}
                  </div>
                );
              }
              if (m.role === "user") {
                return (
                  <div key={i} className="max-w-[80%] self-end">
                    <div className="rounded-2xl rounded-tr-sm border border-line bg-surface-container p-4 text-text">
                      <p className="text-body-md whitespace-pre-wrap">{m.text}</p>
                    </div>
                    <div className="mt-1 text-right font-terminal text-label-sm text-muted">
                      {m.time}
                    </div>
                  </div>
                );
              }
              return (
                <div key={i} className="flex max-w-[85%] gap-4 self-start">
                  <div className="flex h-10 w-10 flex-shrink-0 animate-float-gentle items-center justify-center rounded-full border border-ion bg-surface shadow-[0_0_12px_rgba(71,217,217,0.3)]">
                    <Icon name="smart_toy" className="text-ion" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 font-terminal text-label-sm tracking-wider text-ion">
                      SPARKY · AI MECHANIC
                    </div>
                    <div className="glass-panel rounded-2xl rounded-tl-sm border-ion/40 p-4 text-text shadow-[0_0_15px_rgba(71,217,217,0.1)]">
                      <p className="text-body-md whitespace-pre-wrap leading-relaxed">{m.text}</p>

                      {m.video_link ? (
                        <div className="mt-3 border-t border-line/40 pt-3">
                          <a
                            href={m.video_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-plasma/20 px-3 py-1.5 font-terminal text-label-sm text-plasma transition-colors hover:bg-plasma/30"
                          >
                            <Icon name="bolt" /> {m.video_label || "Watch DIY Guide"}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading ? (
              <div className="flex max-w-[85%] gap-4 self-start">
                <div className="flex h-10 w-10 flex-shrink-0 animate-spin items-center justify-center rounded-full border border-ion bg-surface">
                  <Icon name="refresh" className="text-ion" />
                </div>
                <div className="glass-panel rounded-2xl rounded-tl-sm border-ion/40 p-4 text-muted">
                  <span className="font-terminal text-label-sm animate-pulse">
                    Sparky is running diagnostic simulations...
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-line bg-surface-container-low p-4">
            {currentSuggestions.length > 0 ? (
              <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-3">
                {currentSuggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loading}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 font-terminal text-label-sm whitespace-nowrap text-muted transition-colors hover:border-ion hover:text-ion active:scale-95 disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="flex items-end gap-3">
              <div className="flex flex-1 items-center rounded-xl border border-line bg-surface px-4 py-2 transition-all focus-within:border-plasma focus-within:shadow-[0_0_10px_rgba(33,118,255,0.2)]">
                <textarea
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send(draft);
                    }
                  }}
                  placeholder="Describe symptoms, sounds, or ask Sparky anything..."
                  className="h-10 w-full resize-none border-none bg-transparent py-2 text-body-md text-text placeholder-muted focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => send("Run full OBD2 system diagnostics scan")}
                  className="p-2 text-muted transition-colors hover:text-plasma"
                  title="Run Full Scan"
                >
                  <Icon name="attach_file" />
                </button>
              </div>
              <button
                onClick={() => send(draft)}
                disabled={loading || !draft.trim()}
                aria-label="Send message"
                className="plasma-pulse flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-plasma text-white transition-opacity disabled:opacity-40"
              >
                <Icon name="bolt" />
              </button>
            </div>
          </div>
        </section>

        <section className="glass-panel flex h-[400px] flex-col p-6 md:h-full md:flex-[0_0_35%]">
          <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
            <h2 className="font-display text-headline-sm text-text">Live Diagnostics</h2>
            <Icon name="troubleshoot" className="text-plasma" />
          </div>

          {activeDiagnosis ? (
            <div className="flex flex-1 flex-col justify-between">
              <div className="space-y-4">
                <div className="rounded-xl border border-plasma/30 bg-plasma/10 p-4">
                  <div className="font-terminal text-label-sm text-plasma">ACTIVE QUERY</div>
                  <div className="mt-1 font-display text-body-md text-text">{activeDiagnosis}</div>
                </div>

                <div className="space-y-2">
                  <div className="font-terminal text-label-sm text-muted">MONITORED SUBSYSTEMS</div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-2.5 font-terminal text-label-sm">
                    <span className="flex items-center gap-2"><Icon name="speed" className="text-ion" /> Powertrain / ECU</span>
                    <span className="text-safe">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-2.5 font-terminal text-label-sm">
                    <span className="flex items-center gap-2"><Icon name="warning" className="text-hazard" /> Braking System</span>
                    <span className="text-hazard">INSPECT</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-line bg-surface p-2.5 font-terminal text-label-sm">
                    <span className="flex items-center gap-2"><Icon name="shield" className="text-safe" /> Exhaust / Emissions</span>
                    <span className="text-safe">NORMAL</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-surface-container p-4">
                <div className="flex items-center justify-between">
                  <span className="font-terminal text-label-sm text-muted">Fleet Health Index</span>
                  <span className="font-display text-headline-sm text-safe">87%</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center opacity-70">
              <Icon name="settings_ethernet" className="mb-4 animate-pulse text-6xl text-ion" />
              <p className="font-terminal text-terminal tracking-widest text-ion">
                AWAITING DIAGNOSIS...
              </p>
              <p className="mt-2 text-center text-body-sm text-muted">
                Describe symptoms or click a suggestion below to begin AI fault analysis.
              </p>
            </div>
          )}
        </section>
      </div>

      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onVehicleAdded={(newVeh) => {
          handleSwitchVehicle(newVeh.id);
        }}
      />
    </AppShell>
  );
}

