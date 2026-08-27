import { Link } from "@tanstack/react-router";
import { useState, useEffect, type ReactNode } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Icon } from "./Icon";
import { Dock } from "./Dock";
import { isDemoMode, setDemoMode } from "@/lib/vehicles";

export function AppShell({
  children,
  search = false,
}: {
  children: ReactNode;
  active?: string;
  search?: boolean;
}) {
  useUser();
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(isDemoMode());

    const handleUpdate = () => {
      setDemo(isDemoMode());
    };

    window.addEventListener("autognosis_mode_changed", handleUpdate);
    window.addEventListener("autognosis_vehicles_changed", handleUpdate);
    return () => {
      window.removeEventListener("autognosis_mode_changed", handleUpdate);
      window.removeEventListener("autognosis_vehicles_changed", handleUpdate);
    };
  }, []);

  const handleExitDemo = () => {
    setDemoMode(false);
    setDemo(false);
  };

  return (
    <div className="min-h-screen bg-void text-text selection:bg-plasma selection:text-white">
      {/* Top Header */}
      <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-line bg-glass px-margin-mobile shadow-[0_0_20px_rgba(33,118,255,0.12)] backdrop-blur-xl md:px-margin-desktop">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-display text-headline-md font-bold tracking-tighter text-plasma hover:opacity-90 transition-opacity">
            Autognosis
          </Link>
        </div>

        {search ? (
          <div className="mx-8 hidden max-w-xl flex-1 md:block">
            <div className="group relative">
              <Icon
                name="search"
                className="absolute top-1/2 left-3 -translate-y-1/2 text-muted transition-colors group-focus-within:text-plasma"
              />
              <input
                type="text"
                placeholder="Search fleet, diagnostics, fault codes..."
                className="w-full rounded-lg border border-line bg-deep py-2 pr-4 pl-10 text-text placeholder-muted transition-all focus:border-plasma focus:ring-1 focus:ring-plasma focus:outline-none font-terminal text-sm"
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          {demo ? (
            /* Demo Mode: Swap Account with "Exit Demo Mode" Button */
            <button
              onClick={handleExitDemo}
              className="flex items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/15 px-4 py-1.5 font-terminal text-label-sm font-semibold text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all hover:bg-amber-500/25 active:scale-95"
              title="Exit Demo Sandbox and return to Production Mode"
            >
              <Icon name="logout" className="text-sm" />
              <span>Exit Demo Mode</span>
            </button>
          ) : (
            /* Production Mode: Settings, Notifications and Clerk Auth */
            <>
              <Link
                to="/settings"
                className="rounded-lg p-2 text-muted transition-colors duration-300 hover:bg-surface-container hover:text-ion active:scale-95"
                title="System Settings"
              >
                <Icon name="settings" />
              </Link>
              <button
                className="relative rounded-lg p-2 text-muted transition-colors duration-300 hover:bg-surface-container hover:text-ion active:scale-95"
                title="Notifications"
              >
                <Icon name="notifications" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-hazard animate-pulse" />
              </button>

              {/* Clerk Auth Buttons */}
              <SignedIn>
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 border border-plasma shadow-[0_0_10px_rgba(33,118,255,0.3)]",
                    },
                  }}
                />
              </SignedIn>
              <SignedOut>
                <div className="flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button className="plasma-pulse rounded-lg bg-plasma px-3.5 py-1.5 font-terminal text-label-sm font-semibold text-white shadow-[0_0_12px_rgba(33,118,255,0.3)]">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="hidden rounded-lg border border-line bg-surface px-3 py-1.5 font-terminal text-label-sm text-muted hover:border-ion hover:text-ion sm:inline-block">
                      Sign Up
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </>
          )}
        </div>
      </header>

      {/* Main Page Body with clearance for top header and bottom floating dock */}
      <main className="min-h-screen pt-20 pb-28 w-full">{children}</main>

      {/* Floating Bottom-Center Mission Control Dock */}
      <Dock />
    </div>
  );
}

