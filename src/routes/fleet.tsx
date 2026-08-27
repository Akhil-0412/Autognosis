import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Icon } from "@/components/Icon";
import { VehicleModal } from "@/components/VehicleModal";
import {
  getActiveVehicles,
  deleteVehicle,
  setActiveVehicleId,
  isDemoMode,
  setDemoMode,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/vehicles";

export const Route = createFileRoute("/fleet")({
  component: FleetPage,
  head: () => ({
    meta: [
      { title: "Vehicle Fleet — Autognosis Mission Control" },
      {
        name: "description",
        content:
          "Real-time health scores, active faults and diagnostics for every registered vehicle in your Autognosis fleet.",
      },
      { property: "og:title", content: "Vehicle Fleet — Autognosis Mission Control" },
      {
        property: "og:description",
        content: "Monitor health scores, faults and telemetry for every vehicle in your fleet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

const STATUS_TEXT: Record<VehicleStatus, string> = {
  hazard: "text-hazard",
  safe: "text-safe",
  critical: "text-critical",
};

const BADGE: Record<VehicleStatus, string> = {
  hazard: "bg-hazard text-void",
  safe: "bg-safe text-on-secondary",
  critical: "bg-critical text-white shadow-[0_0_10px_rgba(255,77,26,0.5)]",
};

function useCounter(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const steps = 25;
    const step = Math.ceil(target / steps) || 1;
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      setValue(current);
    }, 40);
    return () => clearInterval(timer);
  }, [target]);
  return value;
}

function Metric({
  label,
  target,
  suffix = "",
  color,
  icon,
}: {
  label: string;
  target: number;
  suffix?: string;
  color: string;
  icon: string;
}) {
  const value = useCounter(target);
  return (
    <div className="glass-panel flex items-center justify-between p-panel-padding">
      <div>
        <div className="mb-1 font-terminal text-label-sm text-muted uppercase">{label}</div>
        <div className={`font-display text-headline-md ${color}`}>
          {value.toLocaleString()}
          {suffix}
        </div>
      </div>
      <Icon name={icon} className={`text-4xl ${color} opacity-50`} />
    </div>
  );
}

function HealthRing({ value, status }: { value: number; status: VehicleStatus }) {
  const [dash, setDash] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setDash(value), 100);
    return () => clearTimeout(t);
  }, [value]);
  const d =
    "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831";
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
        <path className="stroke-current text-line" d={d} fill="none" strokeWidth="3" />
        <path
          className={`stroke-current transition-all duration-1000 ease-out ${STATUS_TEXT[status]}`}
          d={d}
          fill="none"
          strokeWidth="3"
          strokeDasharray={`${dash},100`}
        />
      </svg>
      <div className={`absolute font-terminal text-label-sm font-bold ${STATUS_TEXT[status]}`}>
        {value}%
      </div>
    </div>
  );
}

function FleetPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [demo, setDemo] = useState(false);

  const loadVehicles = () => {
    setVehicles(getActiveVehicles());
    setDemo(isDemoMode());
  };

  useEffect(() => {
    loadVehicles();

    const handleUpdate = () => {
      loadVehicles();
    };

    window.addEventListener("autognosis_mode_changed", handleUpdate);
    window.addEventListener("autognosis_vehicles_changed", handleUpdate);
    return () => {
      window.removeEventListener("autognosis_mode_changed", handleUpdate);
      window.removeEventListener("autognosis_vehicles_changed", handleUpdate);
    };
  }, []);

  const avgHealth =
    vehicles.length > 0
      ? Math.round(vehicles.reduce((acc, v) => acc + v.health, 0) / vehicles.length)
      : 100;

  const handleDiagnose = (vehicle: Vehicle) => {
    setActiveVehicleId(vehicle.id);
    navigate({ to: "/ai-mechanic" });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to remove this vehicle from your fleet?")) {
      deleteVehicle(id);
    }
  };

  return (
    <AppShell active="/fleet">
      <div className="mx-auto max-w-7xl p-margin-mobile md:p-margin-desktop">
        <header className="mb-stack-lg flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-headline-md text-text md:text-headline-lg">
                Vehicle Fleet
              </h1>
              <span className="rounded-full border border-line bg-surface px-3 py-0.5 font-terminal text-label-sm text-plasma">
                {vehicles.length} {vehicles.length === 1 ? "Unit" : "Units"}
              </span>
            </div>
            <p className="mt-1 text-body-md text-muted">
              Real-time status and diagnostics for all registered units.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="plasma-pulse inline-flex items-center gap-2 rounded-xl bg-plasma px-5 py-2.5 font-terminal text-label-md font-semibold text-white shadow-[0_0_20px_rgba(33,118,255,0.35)] transition-all hover:scale-105 active:scale-95"
            >
              <Icon name="add" /> Register Vehicle
            </button>
          </div>
        </header>

        <div className="mb-stack-lg grid grid-cols-1 gap-gutter md:grid-cols-3">
          <Metric label="Active Units" target={vehicles.length} color="text-plasma" icon="directions_car" />
          <Metric label="Diagnostics Executed" target={vehicles.length * 14 + 2} color="text-ion" icon="troubleshoot" />
          <Metric
            label="Avg Fleet Health"
            target={avgHealth}
            suffix="%"
            color={avgHealth >= 80 ? "text-safe" : avgHealth >= 50 ? "text-hazard" : "text-critical"}
            icon="shield"
          />
        </div>

        {vehicles.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-plasma/30 bg-plasma/10 text-plasma shadow-[0_0_30px_rgba(33,118,255,0.2)]">
              <Icon name="directions_car" className="text-4xl" />
            </div>
            <h3 className="font-display text-headline-sm text-text">No Vehicles Registered</h3>
            <p className="mt-2 max-w-md text-body-md text-muted">
              You are currently in Live Production Mode. Click below to add your personal car, fleet van, or truck to begin monitoring.
            </p>
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => setModalOpen(true)}
                className="plasma-pulse inline-flex items-center gap-2 rounded-xl bg-plasma px-6 py-3 font-terminal text-label-md font-semibold text-white"
              >
                <Icon name="add" /> Add Your First Vehicle
              </button>
              <button
                onClick={() => setDemoMode(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 font-terminal text-label-md text-ion hover:border-ion hover:bg-surface-container"
              >
                Load Sample Demo Fleet
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-gutter lg:grid-cols-2 xl:grid-cols-3">
            {vehicles.map((v) => (
              <article
                key={v.id}
                onClick={() => handleDiagnose(v)}
                className={`glass-panel group relative cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
                  v.status === "critical"
                    ? "border-critical/60 shadow-[0_0_20px_rgba(255,77,26,0.15)]"
                    : "hover:border-plasma hover:shadow-[0_0_25px_rgba(33,118,255,0.2)]"
                }`}
              >
                <div className="relative h-36 border-b border-line bg-deep/80 p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-terminal text-label-sm font-bold ${BADGE[v.status]}`}
                    >
                      {v.status === "critical" ? (
                        <Icon name="warning" className="text-[14px]" />
                      ) : (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                      )}
                      {v.badge}
                    </div>

                    {!v.id.startsWith("demo-") ? (
                      <button
                        onClick={(e) => handleDelete(v.id, e)}
                        title="Delete vehicle"
                        className="rounded-lg bg-surface/80 p-1.5 text-muted transition-colors hover:bg-critical/20 hover:text-critical"
                      >
                        <Icon name="delete" className="text-sm" />
                      </button>
                    ) : (
                      <span className="rounded bg-surface-container px-2 py-0.5 font-terminal text-[10px] text-muted">
                        DEMO UNIT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="font-terminal text-label-sm text-muted">
                      {v.vin ? `VIN: ${v.vin.substring(0, 10)}...` : "OBD2 LINK READY"}
                    </div>
                    <span className="font-terminal text-xs text-ion flex items-center gap-1">
                      <Icon name="bolt" className="text-xs" /> Sparky Ready
                    </span>
                  </div>
                </div>

                <div className="p-panel-padding">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-surface-container-high px-2 py-0.5 font-terminal text-label-sm text-muted">
                          {v.year}
                        </span>
                        <h3 className="font-display text-headline-sm text-text">
                          {v.make} {v.model}
                        </h3>
                      </div>
                      <div className="inline-block rounded-sm border border-yellow-500 bg-yellow-400 px-3 py-0.5 font-terminal text-terminal font-bold text-black shadow-sm">
                        {v.plate}
                      </div>
                    </div>
                    <HealthRing value={v.health} status={v.status} />
                  </div>

                  {v.issueDescription ? (
                    <div className="mb-3 rounded-lg border border-hazard/30 bg-hazard/10 px-3 py-2 font-terminal text-label-sm text-hazard">
                      ⚠️ {v.issueDescription}
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-line pt-3 font-terminal text-terminal text-muted">
                    <div className="flex items-center gap-1">
                      <Icon name="speed" className="text-[16px]" /> {v.mileage.toLocaleString()} mi
                    </div>
                    <div className="flex items-center gap-1 text-plasma group-hover:underline">
                      Diagnose <Icon name="arrow_forward" className="text-sm" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setModalOpen(true)}
        title="Add New Vehicle"
        className="plasma-pulse fixed right-6 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-plasma text-white shadow-[0_0_25px_rgba(33,118,255,0.5)] transition-transform hover:scale-110 active:scale-95 md:bottom-8"
      >
        <Icon name="add" className="text-3xl" />
      </button>

      {/* Vehicle Registration Modal */}
      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onVehicleAdded={(newVeh) => {
          loadVehicles();
        }}
      />
    </AppShell>
  );
}
