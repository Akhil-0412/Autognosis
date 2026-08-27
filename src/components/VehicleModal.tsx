import { useState } from "react";
import { Icon } from "@/components/Icon";
import { addVehicle, type Vehicle } from "@/lib/vehicles";

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVehicleAdded?: (vehicle: Vehicle) => void;
}

export function VehicleModal({ isOpen, onClose, onVehicleAdded }: VehicleModalProps) {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState<number>(15000);
  const [vin, setVin] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!make.trim()) newErrors.make = "Vehicle make is required";
    if (!model.trim()) newErrors.model = "Vehicle model is required";
    if (!plate.trim()) newErrors.plate = "License plate / registration is required";
    if (!year || year < 1980 || year > new Date().getFullYear() + 1) {
      newErrors.year = "Enter a valid model year";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const created = addVehicle({
      year,
      make: make.trim(),
      model: model.trim(),
      plate: plate.trim().toUpperCase(),
      vin: vin.trim() || undefined,
      mileage: Number(mileage) || 0,
      issueDescription: issueDescription.trim() || undefined,
    });

    onVehicleAdded?.(created);
    onClose();

    // Reset form
    setMake("");
    setModel("");
    setPlate("");
    setVin("");
    setIssueDescription("");
    setErrors({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-4 backdrop-blur-md">
      <div className="glass-panel relative w-full max-w-lg overflow-hidden border-plasma/40 bg-deep shadow-[0_0_50px_rgba(33,118,255,0.25)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface-container-low p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-plasma/20 text-plasma">
              <Icon name="directions_car" className="text-2xl" />
            </div>
            <div>
              <h2 className="font-display text-headline-sm text-text">Register New Vehicle</h2>
              <p className="font-terminal text-label-sm text-muted">Add telemetry profile to fleet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-container hover:text-text"
          >
            <Icon name="close" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">Model Year *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1980}
                max={new Date().getFullYear() + 1}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 font-terminal text-text focus:border-plasma focus:outline-none"
              />
              {errors.year && <p className="mt-1 text-xs text-critical">{errors.year}</p>}
            </div>

            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">Manufacturer (Make) *</label>
              <input
                type="text"
                placeholder="e.g. Ford, Toyota, BMW"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-text placeholder-muted focus:border-plasma focus:outline-none"
              />
              {errors.make && <p className="mt-1 text-xs text-critical">{errors.make}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">Model Name *</label>
              <input
                type="text"
                placeholder="e.g. F-150, Camry, 330i"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-text placeholder-muted focus:border-plasma focus:outline-none"
              />
              {errors.model && <p className="mt-1 text-xs text-critical">{errors.model}</p>}
            </div>

            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">License Plate *</label>
              <input
                type="text"
                placeholder="e.g. AB24 XYZ"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 font-terminal uppercase text-text placeholder-muted focus:border-plasma focus:outline-none"
              />
              {errors.plate && <p className="mt-1 text-xs text-critical">{errors.plate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">Current Odometer (Miles)</label>
              <input
                type="number"
                placeholder="e.g. 42000"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 font-terminal text-text focus:border-plasma focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-terminal text-label-sm text-muted">VIN (Optional)</label>
              <input
                type="text"
                placeholder="17-character VIN"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 font-terminal uppercase text-text placeholder-muted focus:border-plasma focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-terminal text-label-sm text-muted">Current Symptoms / Diagnostic Notes</label>
            <textarea
              rows={2}
              placeholder="e.g. Check engine light on, minor squeak in front brakes"
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-text placeholder-muted focus:border-plasma focus:outline-none"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-line px-4 py-2 font-terminal text-label-sm text-muted hover:bg-surface-container hover:text-text"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="plasma-pulse inline-flex items-center gap-2 rounded-lg bg-plasma px-5 py-2 font-terminal text-label-sm font-semibold text-white shadow-[0_0_15px_rgba(33,118,255,0.4)]"
            >
              <Icon name="add" /> Register Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
