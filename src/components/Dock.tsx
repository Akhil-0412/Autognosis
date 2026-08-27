import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GlassSurface } from "./ui/GlassSurface";
import { Icon } from "./Icon";

/**
 * Floating Navigation Dock — bottom centre HUD.
 * Ported from F1-Podium-Predictor with Autognosis cyberpunk aesthetic.
 *
 * At rest it recedes: shrunk slightly and tucked a touch above its full
 * position, so it keeps a presence without competing with the page.
 * Pointer contact or keyboard focus brings it back to full size immediately.
 */

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: "Vehicle Fleet", href: "/fleet", icon: "directions_car" },
  { name: "Sparky AI Mechanic", href: "/ai-mechanic", icon: "smart_toy" },
  { name: "Billing & Plans", href: "/billing", icon: "credit_card" },
  { name: "Settings", href: "/settings", icon: "settings" },
];

const COLLAPSE_DELAY_MS = 3000;
const INITIAL_SETTLE_MS = 3000;

export function Dock() {
  const location = useLocation();
  const pathname = location.pathname;
  const [expanded, setExpanded] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const scheduleCollapse = (delay: number) => {
    clearPending();
    timer.current = setTimeout(() => setExpanded(false), delay);
  };

  useEffect(() => {
    scheduleCollapse(INITIAL_SETTLE_MS);
    return clearPending;
  }, []);

  const handleEnter = () => {
    clearPending();
    setExpanded(true);
  };

  const handleLeave = () => {
    scheduleCollapse(COLLAPSE_DELAY_MS);
  };

  return (
    <nav
      aria-label="Primary Mission Control Dock"
      data-expanded={expanded}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          handleLeave();
        }
      }}
      className="dock fixed bottom-5 left-1/2 z-50 flex items-center gap-1.5 px-3 py-2 rounded-[22px] shadow-[0_12px_45px_rgba(0,0,0,0.65),0_0_0_1px_rgba(33,118,255,0.25)] max-w-[calc(100vw-2rem)] overflow-x-auto no-scrollbar backdrop-blur-2xl"
    >
      {/* Fluid Glass Surface */}
      <GlassSurface rounded="rounded-[22px]" />

      {/* Nav items above glass */}
      <div className="relative z-10 flex items-center gap-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              to={item.href}
              aria-label={item.name}
              aria-current={isActive ? "page" : undefined}
              className={`relative group flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] transition-all duration-300 ${
                isActive
                  ? "bg-plasma/20 border border-plasma/50 shadow-[0_0_15px_rgba(33,118,255,0.4)]"
                  : "hover:bg-surface-container-high/40"
              }`}
            >
              <Icon
                name={item.icon}
                className={`relative z-10 text-[20px] transition-colors duration-200 ${
                  isActive ? "text-plasma" : "text-muted group-hover:text-text"
                }`}
                filled={isActive}
              />

              {/* Label Tooltip */}
              <span
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-surface-container-highest px-3 py-1.5 font-terminal text-xs text-text shadow-[0_4px_20px_rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity z-50"
              >
                {item.name}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-x-4 border-t-4 border-x-transparent border-t-surface-container-highest" />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default Dock;
