import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { StripeMockModal, type PlanDetails } from "@/components/StripeMockModal";
import { getActiveVehicles, setDemoMode } from "@/lib/vehicles";
import {
  getDailyUsage,
  getTimeUntilMidnight,
  getPlanLimits,
  resetDailyUsageManual,
  type DailyUsage,
} from "@/lib/usage";

export const Route = createFileRoute("/billing")({
  component: BillingPage,
  head: () => ({
    meta: [
      { title: "Billing & Subscriptions — Autognosis Fleet Plans" },
      {
        name: "description",
        content:
          "Manage your Autognosis fleet plan, monitor AI query usage and download past invoices from one console.",
      },
      { property: "og:title", content: "Billing & Subscriptions — Autognosis Fleet Plans" },
      {
        property: "og:description",
        content: "Compare fleet plans, track usage limits and review invoice history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const DEFAULT_INVOICES = [
  { id: "in_1Nxt8201", date: "2026-08-01", desc: "Starter Plan - Monthly", amount: "$5.00" },
  { id: "in_1Mxq7102", date: "2026-07-01", desc: "Starter Plan - Monthly", amount: "$5.00" },
  { id: "in_1Lzp5093", date: "2026-06-01", desc: "Starter Plan - Monthly", amount: "$5.00" },
];

function BillingPage() {
  const [activePlan, setActivePlan] = useState<string>("Starter");
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [invoices, setInvoices] = useState(DEFAULT_INVOICES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [usage, setUsage] = useState<DailyUsage>({
    date: new Date().toISOString().split("T")[0],
    promptsUsed: 0,
    tokensUsed: 0,
    lastResetTimestamp: Date.now(),
  });
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const [vehicleCount, setVehicleCount] = useState(0);

  useEffect(() => {
    const savedPlan = localStorage.getItem("autognosis_active_plan");
    if (savedPlan) setActivePlan(savedPlan);

    const savedInvoices = localStorage.getItem("autognosis_invoices");
    if (savedInvoices) {
      try {
        setInvoices(JSON.parse(savedInvoices));
      } catch (e) {
        console.error(e);
      }
    }

    setUsage(getDailyUsage());
    setVehicleCount(getActiveVehicles().length);

    // Live countdown timer for 00:00 midnight reset
    const timer = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
      setUsage(getDailyUsage());
    }, 1000);

    const handleUsageUpdate = () => {
      setUsage(getDailyUsage());
      setVehicleCount(getActiveVehicles().length);
    };

    window.addEventListener("autognosis_usage_updated", handleUsageUpdate);
    window.addEventListener("autognosis_vehicles_changed", handleUsageUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("autognosis_usage_updated", handleUsageUpdate);
      window.removeEventListener("autognosis_vehicles_changed", handleUsageUpdate);
    };
  }, []);

  const handleOpenStripe = (name: string, price: string, amountNumber: number, period: string, features: string[]) => {
    setSelectedPlan({ name, price, amountNumber, period, features });
    setIsStripeModalOpen(true);
  };

  const handlePaymentSuccess = (receipt: { id: string; date: string; desc: string; amount: string }) => {
    if (!selectedPlan) return;
    setActivePlan(selectedPlan.name);
    localStorage.setItem("autognosis_active_plan", selectedPlan.name);

    const updated = [receipt, ...invoices];
    setInvoices(updated);
    localStorage.setItem("autognosis_invoices", JSON.stringify(updated));

    setToastMessage(`⚡ Success! Upgraded to ${selectedPlan.name} plan. Receipt ${receipt.id} recorded.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const limits = getPlanLimits(activePlan);
  const promptPercent = limits.isUnlimited
    ? Math.min(100, Math.max(8, usage.promptsUsed * 6))
    : Math.min(100, (usage.promptsUsed / (typeof limits.promptLimit === "number" ? limits.promptLimit : 100)) * 100);

  const vehiclePercent = typeof limits.maxVehicles === "number"
    ? Math.min(100, (vehicleCount / limits.maxVehicles) * 100)
    : Math.min(100, Math.max(10, vehicleCount * 10));

  return (
    <AppShell active="/billing" search>
      <div className="mx-auto max-w-7xl space-y-stack-lg p-margin-mobile md:p-margin-desktop">
        
        {/* Header with Stripe Test Mode Badge */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-headline-md text-text md:text-headline-lg">
              Billing &amp; Subscriptions
            </h1>
            <p className="mt-2 text-body-md text-muted">
              Manage your fleet plan, monitor daily token quotas, and simulate Stripe test checkout.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 font-terminal text-xs text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Stripe Developer Mock Gateway: <strong>ACTIVE</strong></span>
          </div>
        </div>

        {/* Success Toast */}
        {toastMessage && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/50 bg-emerald-950/40 p-4 font-terminal text-sm text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-2">
              <Icon name="check" className="text-xl text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
              <Icon name="close" />
            </button>
          </div>
        )}

        {/* Pricing Cards Grid ($5, $10, $15) */}
        <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
          
          {/* Starter Plan - $5/mo */}
          <div className={`glass-panel flex flex-col justify-between p-panel-padding transition-all duration-300 ${
            activePlan === "Starter" ? "border-plasma/80 shadow-[0_0_20px_rgba(33,118,255,0.2)]" : "hover:border-plasma"
          }`}>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-headline-sm text-text">Starter</h2>
                {activePlan === "Starter" && (
                  <span className="rounded border border-plasma/50 bg-plasma/20 px-2 py-0.5 font-terminal text-xs text-plasma">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-6 flex items-baseline">
                <span className="font-display text-headline-md font-bold text-plasma">$5</span>
                <span className="ml-1 text-body-sm text-muted">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                {["Up to 5 Vehicles", "Basic Diagnostics", "100 AI Queries/day (resets at 00:00)", "Community Support"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm text-text">
                    <Icon name="check" className="text-[18px] text-ion" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleOpenStripe("Starter", "$5.00", 5, "month", ["Up to 5 Vehicles", "100 AI Queries/day"])}
              className={`w-full rounded-lg py-2.5 font-terminal text-label-md transition-all ${
                activePlan === "Starter"
                  ? "border border-plasma/40 bg-plasma/10 text-plasma"
                  : "border border-line bg-transparent text-muted hover:border-plasma hover:text-plasma"
              }`}
            >
              {activePlan === "Starter" ? "✓ Active Plan" : "Switch to Starter ($5)"}
            </button>
          </div>

          {/* Pro Fleet Plan - $10/mo */}
          <div className={`glass-panel relative flex flex-col justify-between p-panel-padding transition-all duration-300 ${
            activePlan === "Pro Fleet"
              ? "border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.3)]"
              : "border-plasma shadow-[0_0_30px_rgba(33,118,255,0.25)]"
          }`}>
            <div className="absolute -top-3 right-6 rounded-full border border-plasma bg-plasma px-3 py-0.5 font-terminal text-xs font-semibold text-white shadow-[0_0_12px_rgba(33,118,255,0.5)]">
              {activePlan === "Pro Fleet" ? "Active Subscription" : "MOST POPULAR"}
            </div>

            <div>
              <div className="mb-4 flex items-start justify-between gap-2">
                <h2 className="font-display text-headline-sm text-plasma">Pro Fleet</h2>
              </div>
              <div className="mb-6 flex items-baseline">
                <span className="font-display text-headline-md font-bold text-text">$10</span>
                <span className="ml-1 text-body-sm text-muted">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                {[
                  "Up to 50 Vehicles",
                  "Advanced Sensor Tracking",
                  "Unlimited AI Queries",
                  "Sparky Voice & Live Assist",
                  "Priority OBD2 Polling",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm text-text">
                    <Icon name="check" className="text-[18px] text-plasma" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => handleOpenStripe("Pro Fleet", "$10.00", 10, "month", [
                "Up to 50 Vehicles",
                "Unlimited AI Queries",
                "Priority Support",
              ])}
              className="plasma-pulse flex w-full items-center justify-center gap-2 rounded-lg bg-[#635BFF] py-3 font-terminal text-label-md font-semibold text-white shadow-[0_0_20px_rgba(99,91,255,0.4)] transition-all hover:bg-[#5851EA] active:scale-95"
            >
              <Icon name="credit_card" />
              {activePlan === "Pro Fleet" ? "✓ Renewed via Stripe ($10)" : "Pay with Stripe ($10)"}
            </button>
          </div>

          {/* Enterprise Plan - $15/mo */}
          <div className={`glass-panel flex flex-col justify-between p-panel-padding transition-colors duration-300 ${
            activePlan === "Enterprise" ? "border-ion shadow-[0_0_25px_rgba(71,217,217,0.25)]" : "hover:border-plasma"
          }`}>
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-headline-sm text-text">Enterprise</h2>
                {activePlan === "Enterprise" && (
                  <span className="rounded border border-ion/50 bg-ion/20 px-2 py-0.5 font-terminal text-xs text-ion">
                    Current Plan
                  </span>
                )}
              </div>
              <div className="mb-6 flex items-baseline">
                <span className="font-display text-headline-md font-bold text-text">$15</span>
                <span className="ml-1 text-body-sm text-muted">/month</span>
              </div>
              <ul className="mb-8 space-y-3">
                {[
                  "Unlimited Vehicles & Telemetry",
                  "Custom REST & Webhook APIs",
                  "Dedicated Account Manager",
                  "Custom LLM Fine-Tuning",
                  "SLA Guarantee (99.99%)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-body-sm text-text">
                    <Icon name="check" className="text-[18px] text-ion" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleOpenStripe("Enterprise", "$15.00", 15, "month", [
                "Unlimited Vehicles",
                "Custom APIs",
                "Dedicated SLA",
              ])}
              className="w-full rounded-lg border border-ion bg-glass py-2.5 font-terminal text-label-md text-ion transition-all hover:bg-ion/10"
            >
              {activePlan === "Enterprise" ? "✓ Active Plan" : "Subscribe Enterprise ($15)"}
            </button>
          </div>
        </div>

        {/* Free Trial Demo Sandbox Card */}
        <div className="glass-panel border-ion/40 bg-gradient-to-r from-surface-container-low via-surface to-surface-container-low p-panel-padding flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_25px_rgba(71,217,217,0.15)]">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-ion/20 text-ion shadow-[0_0_20px_rgba(71,217,217,0.25)]">
              <Icon name="smart_toy" className="text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-text">Free Trial Demo Sandbox</h3>
                <span className="rounded-md border border-ion/50 bg-ion/10 px-2 py-0.5 font-terminal text-[10px] font-semibold text-ion uppercase">No Account Required</span>
              </div>
              <p className="mt-1 text-body-sm text-muted">
                Explore the AI mechanic and live telemetry HUD with 3 pre-configured demo vehicles (Ford F-150, Tesla Model Y, BMW 330i) without registering vehicles or creating an account.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setDemoMode(true);
              window.location.href = "/fleet";
            }}
            className="flex-shrink-0 flex items-center gap-2 rounded-xl border border-ion/50 bg-ion/10 px-6 py-3 font-terminal text-label-md font-semibold text-ion hover:bg-ion/20 shadow-[0_0_15px_rgba(71,217,217,0.2)] transition-all active:scale-95"
          >
            <Icon name="bolt" />
            Launch Demo Mode Fleet
          </button>
        </div>

        {/* Current Usage Metrics with Real 00:00 Daily Reset System */}
        <div className="glass-panel p-panel-padding">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="flex items-center gap-2 font-display text-headline-sm text-text">
              <Icon name="monitoring" className="text-plasma" />
              Current Cycle Usage ({activePlan} Tier)
            </h2>

            {/* Live 00:00 Countdown Badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-deep px-3 py-1.5 font-terminal text-xs text-muted">
                <span className="h-2 w-2 rounded-full bg-plasma animate-pulse" />
                <span>Daily Token Reset in: <strong className="font-mono text-text">{countdown.formatted}</strong> (00:00 UTC)</span>
              </div>
              <button
                onClick={() => {
                  resetDailyUsageManual();
                  setToastMessage("🔄 Tokens & Prompts manually reset for testing.");
                  setTimeout(() => setToastMessage(null), 3000);
                }}
                className="rounded-lg border border-line bg-glass px-2.5 py-1.5 font-terminal text-xs text-muted hover:border-plasma hover:text-plasma transition-all"
                title="Simulate daily 00:00 reset"
              >
                Reset Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-stack-lg md:grid-cols-2">
            
            {/* Real Prompts & Tokens Tracker */}
            <div className="space-y-2">
              <div className="flex justify-between font-terminal text-label-md">
                <span className="text-text">AI Diagnostic Prompts (Today)</span>
                <span className="font-mono text-plasma">
                  {usage.promptsUsed} {limits.isUnlimited ? "/ Unlimited" : `/ ${limits.promptLimit}`}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-line bg-deep">
                <div
                  className={`relative h-full rounded-full transition-all duration-500 ${
                    limits.isUnlimited ? "bg-emerald-400" : usage.promptsUsed > 80 ? "bg-hazard" : "bg-plasma"
                  }`}
                  style={{ width: `${promptPercent}%` }}
                >
                  <div className="absolute top-0 right-0 bottom-0 w-4 animate-pulse bg-white/30 blur-[2px]" />
                </div>
              </div>
              <div className="flex justify-between font-terminal text-xs text-muted">
                <span>Estimated: ~{usage.tokensUsed.toLocaleString()} tokens consumed</span>
                <span>{limits.isUnlimited ? "Unlimited Quota" : `${100 - usage.promptsUsed} prompts remaining`}</span>
              </div>
            </div>

            {/* Real Active Vehicles Tracker */}
            <div className="space-y-2">
              <div className="flex justify-between font-terminal text-label-md">
                <span className="text-text">Active Vehicles Registered</span>
                <span className="font-mono text-safe">
                  {vehicleCount} / {limits.maxVehicles}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-line bg-deep">
                <div
                  className="h-full rounded-full bg-safe transition-all duration-500"
                  style={{ width: `${vehiclePercent}%` }}
                />
              </div>
              <div className="flex justify-between font-terminal text-xs text-muted">
                <span>{vehicleCount === 0 ? "No vehicles added yet" : `${vehicleCount} units online`}</span>
                <span className="text-safe">Telemetry link active</span>
              </div>
            </div>

          </div>
        </div>

        {/* Invoice History with Stripe Receipts */}
        <div className="glass-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-line p-panel-padding">
            <h2 className="font-display text-headline-sm text-text">Invoice &amp; Receipt History</h2>
            <button
              onClick={() => alert("Simulated batch export: Invoices exported to PDF.")}
              className="font-terminal text-label-sm text-ion transition-colors hover:text-plasma"
            >
              Download All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-surface-container-low">
                  {["Receipt ID", "Date", "Description", "Amount", "Status"].map((h) => (
                    <th key={h} className="p-4 font-terminal text-label-md text-muted">
                      {h}
                    </th>
                  ))}
                  <th className="p-4 text-right font-terminal text-label-md text-muted">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-terminal text-terminal">
                {invoices.map((inv) => (
                  <tr key={inv.id || inv.date} className="transition-colors hover:bg-surface/50">
                    <td className="p-4 font-mono text-xs text-plasma">{inv.id || "in_legacy"}</td>
                    <td className="p-4 text-text">{inv.date}</td>
                    <td className="p-4 text-text">{inv.desc}</td>
                    <td className="p-4 font-bold text-text">{inv.amount}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 rounded border border-safe/30 bg-safe/10 px-2 py-1 text-label-sm text-safe">
                        <span className="h-1.5 w-1.5 rounded-full bg-safe" /> Stripe Paid
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => alert(`Receipt ${inv.id || inv.date}: $${inv.amount} for ${inv.desc} downloaded.`)}
                        aria-label={`Download invoice ${inv.date}`}
                        className="text-muted transition-colors hover:text-plasma"
                        title="Download Stripe PDF Receipt"
                      >
                        <Icon name="download" className="text-[20px]" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stripe Developer Mock Modal */}
      <StripeMockModal
        isOpen={isStripeModalOpen}
        plan={selectedPlan}
        onClose={() => setIsStripeModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />
    </AppShell>
  );
}
