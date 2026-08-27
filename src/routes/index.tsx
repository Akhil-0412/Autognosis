import { createFileRoute, Link } from "@tanstack/react-router";
import { Icon } from "@/components/Icon";
import { setDemoMode } from "@/lib/vehicles";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Autognosis — Your AI Mechanic, Always Under the Hood" },
      {
        name: "description",
        content:
          "Autognosis diagnoses vehicle problems in seconds with Sparky, the AI mechanic. Connect an OBD2 scanner and run mission control for your fleet.",
      },
      { property: "og:title", content: "Autognosis — Your AI Mechanic, Always Under the Hood" },
      {
        property: "og:description",
        content:
          "AI-powered OBD2 diagnostics, fleet health monitoring and proactive fault alerts in one HUD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const FEATURES = [
  {
    icon: "precision_manufacturing",
    color: "plasma",
    title: "Instant Diagnostics",
    body: "Real-time OBD2 code translation with AI-driven repair recommendations. Eliminate guesswork with pinpoint accuracy.",
  },
  {
    icon: "directions_car",
    color: "ion",
    title: "Fleet Overview",
    body: "Monitor multiple vehicles from a centralized mission control. Track health scores, active faults, and service history.",
  },
  {
    icon: "sensors",
    color: "hazard",
    title: "Proactive Alerts",
    body: "Receive notifications before minor issues become catastrophic failures based on predictive sensor modeling.",
  },
] as const;

const ACCENT: Record<string, string> = {
  plasma: "bg-plasma/10 border-plasma/30 text-plasma group-hover:bg-plasma/20",
  ion: "bg-ion/10 border-ion/30 text-ion group-hover:bg-ion/20",
  hazard: "bg-hazard/10 border-hazard/30 text-hazard group-hover:bg-hazard/20",
};

const BORDER: Record<string, string> = {
  plasma: "hover:border-plasma",
  ion: "hover:border-ion",
  hazard: "hover:border-hazard",
};

function LandingPage() {
  return (
    <div className="min-h-screen bg-void">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-line bg-glass px-margin-mobile shadow-[0_0_20px_rgba(33,118,255,0.15)] backdrop-blur-xl transition-all duration-300 md:px-margin-desktop">
        <div className="font-display text-headline-md font-bold tracking-tighter text-plasma">
          Autognosis
        </div>
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="font-terminal text-label-md text-muted transition-colors duration-300 hover:text-ion"
          >
            Features
          </a>
          <Link
            to="/billing"
            className="font-terminal text-label-md text-muted transition-colors duration-300 hover:text-ion"
          >
            Pricing
          </Link>
        </nav>
        <Link
          to="/fleet"
          className="plasma-pulse rounded-lg bg-plasma px-6 py-2 font-terminal text-label-md text-white"
        >
          Get Started
        </Link>
      </header>

      <main>
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
          <div className="bg-hero-glow absolute inset-0 z-0 opacity-50" />
          <div className="bg-grid absolute inset-0 z-0 opacity-30" />
          <div className="relative z-10 container mx-auto flex flex-col items-center px-margin-mobile text-center md:px-margin-desktop">
            <div className="mb-stack-lg inline-flex animate-float-gentle items-center gap-2 rounded-full border border-plasma/50 bg-plasma/10 px-4 py-2 backdrop-blur-md">
              <Icon name="smart_toy" className="text-sm text-ion" />
              <span className="font-terminal text-label-sm tracking-widest text-ion uppercase">
                AI-Powered Diagnostic HUD
              </span>
            </div>
            <h1 className="mb-stack-md max-w-4xl font-display text-headline-md md:text-headline-lg">
              Your AI Mechanic, <br />
              <span className="text-gradient">Always Under the Hood.</span>
            </h1>
            <p className="mb-stack-lg max-w-2xl text-body-lg text-muted">
              Autognosis uses Sparky to diagnose vehicle problems in seconds. Connect your OBD2
              scanner and let the mission control for your car take over.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/ai-mechanic"
                className="plasma-pulse flex items-center justify-center gap-2 rounded-lg bg-plasma px-8 py-3 font-terminal text-label-md text-white"
              >
                <Icon name="bolt" />
                Start Diagnosis
              </Link>
              <Link
                to="/fleet"
                onClick={() => setDemoMode(true)}
                className="rounded-lg border border-line bg-transparent px-8 py-3 font-terminal text-label-md text-muted transition-all duration-300 hover:border-text hover:text-text"
              >
                View Demo Fleet
              </Link>
            </div>
          </div>
          <div className="pointer-events-none absolute bottom-0 z-10 h-32 w-full bg-gradient-to-t from-void to-transparent" />
        </section>

        <section id="features" className="relative z-20 bg-void py-24">
          <div className="container mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="mb-16 text-center">
              <h2 className="mb-2 font-display text-headline-sm text-text">Core Telemetry</h2>
              <p className="text-body-md text-muted">
                Advanced tools for fleet management and diagnostics.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className={`glass-panel group p-panel-padding transition-colors duration-300 ${BORDER[f.color]}`}
                >
                  <div
                    className={`mb-stack-md flex h-12 w-12 items-center justify-center rounded-lg border transition-colors ${ACCENT[f.color]}`}
                  >
                    <Icon name={f.icon} />
                  </div>
                  <h3 className="mb-stack-sm font-terminal text-label-md text-text">{f.title}</h3>
                  <p className="text-body-sm text-muted">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-line bg-deep py-24">
          <div className="bg-hero-glow absolute inset-0 z-0 opacity-30" />
          <div className="relative z-10 container mx-auto px-margin-mobile text-center md:px-margin-desktop">
            <h2 className="mb-stack-md font-display text-headline-md">
              <span className="text-gradient">Ready to meet Sparky?</span>
            </h2>
            <p className="mx-auto mb-stack-lg max-w-xl text-body-lg text-muted">
              Join the future of vehicle maintenance. Connect your fleet today.
            </p>
            <Link
              to="/ai-mechanic"
              className="mx-auto flex w-fit items-center justify-center gap-2 rounded-lg border border-ion bg-glass px-8 py-3 font-terminal text-label-md text-ion transition-all duration-300 hover:bg-ion/10"
            >
              <Icon name="smart_toy" />
              Initialize System
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-void py-8 text-center text-body-sm text-muted">
        <p>© 2026 Autognosis. System Online.</p>
      </footer>
    </div>
  );
}
