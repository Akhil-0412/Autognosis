export type VehicleStatus = "safe" | "hazard" | "critical";

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  plate: string;
  vin?: string;
  mileage: number;
  health: number;
  status: VehicleStatus;
  badge: string;
  lastChecked: string;
  issueDescription?: string;
}

export const DEMO_VEHICLES: Vehicle[] = [
  {
    id: "demo-1",
    year: 2023,
    make: "Ford",
    model: "F-150 EcoBoost",
    plate: "LD23 VBN",
    vin: "1FTFW1E84KFC29103",
    mileage: 14203,
    health: 65,
    status: "hazard",
    badge: "Service Required",
    lastChecked: "2h ago",
    issueDescription: "Camshaft phaser rattle on acceleration",
  },
  {
    id: "demo-2",
    year: 2024,
    make: "Tesla",
    model: "Model Y Dual Motor",
    plate: "MN24 XYZ",
    vin: "7SAYGDEE1RF892011",
    mileage: 3450,
    health: 98,
    status: "safe",
    badge: "Optimal",
    lastChecked: "5m ago",
  },
  {
    id: "demo-3",
    year: 2021,
    make: "BMW",
    model: "3 Series 330i",
    plate: "AF21 BQZ",
    vin: "WBA5R7C58M8B99124",
    mileage: 89102,
    health: 24,
    status: "critical",
    badge: "Critical Fault",
    lastChecked: "Engine Misfire",
    issueDescription: "Cylinder 3 misfire detected (P0303)",
  },
];

const STORAGE_KEY = "autognosis_user_vehicles";
const DEMO_MODE_KEY = "autognosis_demo_mode";
const ACTIVE_VEHICLE_KEY = "autognosis_active_vehicle_id";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const val = localStorage.getItem(DEMO_MODE_KEY);
  return val !== "false"; // Default to demo mode on first visit for rich experience
}

export function setDemoMode(enable: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_MODE_KEY, enable ? "true" : "false");
  window.dispatchEvent(new Event("autognosis_mode_changed"));
}

export function getUserVehicles(): Vehicle[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserVehicles(vehicles: Vehicle[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  window.dispatchEvent(new Event("autognosis_vehicles_changed"));
}

export function getActiveVehicles(): Vehicle[] {
  if (isDemoMode()) {
    const userVehicles = getUserVehicles();
    return userVehicles.length > 0 ? [...userVehicles, ...DEMO_VEHICLES] : DEMO_VEHICLES;
  }
  return getUserVehicles();
}

export function addVehicle(data: Omit<Vehicle, "id" | "health" | "status" | "badge" | "lastChecked">): Vehicle {
  const userVehicles = getUserVehicles();
  
  // Calculate initial baseline health
  let health = 95;
  let status: VehicleStatus = "safe";
  let badge = "Optimal";

  if (data.mileage > 100000) {
    health = 68;
    status = "hazard";
    badge = "Maintenance Due";
  } else if (data.mileage > 60000) {
    health = 82;
    status = "safe";
    badge = "Good Condition";
  }

  const newVehicle: Vehicle = {
    ...data,
    id: "veh_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
    health,
    status,
    badge,
    lastChecked: "Just now",
  };

  const updated = [newVehicle, ...userVehicles];
  saveUserVehicles(updated);
  setActiveVehicleId(newVehicle.id);
  return newVehicle;
}

export function updateVehicle(id: string, updates: Partial<Vehicle>): void {
  const userVehicles = getUserVehicles();
  const index = userVehicles.findIndex((v) => v.id === id);
  if (index !== -1) {
    userVehicles[index] = { ...userVehicles[index], ...updates };
    saveUserVehicles(userVehicles);
  }
}

export function deleteVehicle(id: string): void {
  const userVehicles = getUserVehicles();
  const filtered = userVehicles.filter((v) => v.id !== id);
  saveUserVehicles(filtered);
}

export function getActiveVehicle(): Vehicle | null {
  const all = getActiveVehicles();
  if (all.length === 0) return null;
  if (typeof window === "undefined") return all[0];

  const activeId = localStorage.getItem(ACTIVE_VEHICLE_KEY);
  const found = all.find((v) => v.id === activeId);
  return found || all[0];
}

export function setActiveVehicleId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_VEHICLE_KEY, id);
  window.dispatchEvent(new Event("autognosis_active_vehicle_changed"));
}
