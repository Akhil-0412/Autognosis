"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Car, Gauge, Wrench, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Vehicle {
    id?: string;
    make: string;
    model: string;
    year: number;
    mileage?: number | null;
    color?: string | null;
    healthScore: number;
    healthNote?: string | null;
}

interface VehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (vehicle: Partial<Vehicle>) => Promise<void>;
    vehicle?: Vehicle | null;
    mode: "add" | "edit" | "health";
}

export function VehicleModal({ isOpen, onClose, onSave, vehicle, mode }: VehicleModalProps) {
    const [make, setMake] = useState("");
    const [model, setModel] = useState("");
    const [year, setYear] = useState("");
    const [mileage, setMileage] = useState("");
    const [color, setColor] = useState("");
    const [healthScore, setHealthScore] = useState("100");
    const [healthNote, setHealthNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (vehicle) {
            setMake(vehicle.make || "");
            setModel(vehicle.model || "");
            setYear(vehicle.year?.toString() || "");
            setMileage(vehicle.mileage?.toString() || "");
            setColor(vehicle.color || "");
            setHealthScore(vehicle.healthScore?.toString() || "100");
            setHealthNote(vehicle.healthNote || "");
        } else {
            // Reset form
            setMake("");
            setModel("");
            setYear("");
            setMileage("");
            setColor("");
            setHealthScore("100");
            setHealthNote("");
        }
    }, [vehicle, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data: Partial<Vehicle> = {
                ...(vehicle?.id && { id: vehicle.id }),
            };

            if (mode === "health") {
                data.healthScore = parseInt(healthScore);
                data.healthNote = healthNote;
            } else {
                data.make = make;
                data.model = model;
                data.year = parseInt(year);
                data.mileage = mileage ? parseInt(mileage) : null;
                data.color = color || null;
                data.healthScore = parseInt(healthScore);
                data.healthNote = healthNote || null;
            }

            await onSave(data);
            onClose();
        } catch (error) {
            console.error("Error saving vehicle:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case "add": return "Add New Vehicle";
            case "edit": return "Edit Vehicle";
            case "health": return "Update Health Status";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed inset-0 flex items-center justify-center z-50 p-4"
                    >
                        <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl shadow-black/40 w-full max-w-lg overflow-hidden">
                            {/* Top accent */}
                            <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />

                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                        {mode === "health" ? (
                                            <Gauge className="h-5 w-5 text-white" />
                                        ) : (
                                            <Car className="h-5 w-5 text-white" />
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground">{getTitle()}</h2>
                                </div>
                                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {mode !== "health" && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Make *</Label>
                                                <Input
                                                    value={make}
                                                    onChange={e => setMake(e.target.value)}
                                                    placeholder="e.g. Toyota"
                                                    required
                                                    className="bg-muted/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Model *</Label>
                                                <Input
                                                    value={model}
                                                    onChange={e => setModel(e.target.value)}
                                                    placeholder="e.g. Camry"
                                                    required
                                                    className="bg-muted/50"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Year *</Label>
                                                <Input
                                                    type="number"
                                                    value={year}
                                                    onChange={e => setYear(e.target.value)}
                                                    placeholder="2020"
                                                    required
                                                    min="1900"
                                                    max="2030"
                                                    className="bg-muted/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Mileage</Label>
                                                <Input
                                                    type="number"
                                                    value={mileage}
                                                    onChange={e => setMileage(e.target.value)}
                                                    placeholder="50000"
                                                    className="bg-muted/50"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Color</Label>
                                                <Input
                                                    value={color}
                                                    onChange={e => setColor(e.target.value)}
                                                    placeholder="Black"
                                                    className="bg-muted/50"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Health Section */}
                                <div className="space-y-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                                    <div className="flex items-center gap-2">
                                        <Wrench className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-foreground">Health Status</span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-foreground">Health Score</Label>
                                            <span className="text-2xl font-bold text-primary">{healthScore}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={healthScore}
                                            onChange={e => setHealthScore(e.target.value)}
                                            className="w-full h-3 bg-muted rounded-full appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Critical</span>
                                            <span>Fair</span>
                                            <span>Good</span>
                                            <span>Excellent</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-foreground">Health Notes</Label>
                                        <Textarea
                                            value={healthNote}
                                            onChange={e => setHealthNote(e.target.value)}
                                            placeholder="Describe current condition, recent repairs, upcoming maintenance..."
                                            className="bg-muted/50 min-h-[80px]"
                                        />
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex gap-3 pt-2">
                                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="garage" className="flex-1" disabled={loading}>
                                        {loading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        {mode === "add" ? "Add Vehicle" : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
