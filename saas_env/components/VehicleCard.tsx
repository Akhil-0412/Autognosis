"use client";

import { motion } from "framer-motion";
import { Car, Gauge, Wrench, MoreVertical, Edit, Trash2, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    mileage?: number | null;
    color?: string | null;
    healthScore: number;
    healthNote?: string | null;
    imageUrl?: string | null;
}

interface VehicleCardProps {
    vehicle: Vehicle;
    onEdit: (vehicle: Vehicle) => void;
    onDelete: (id: string) => void;
    onUpdateHealth: (vehicle: Vehicle) => void;
}

function getHealthColor(score: number): string {
    if (score >= 80) return "text-green-500";
    if (score >= 50) return "text-yellow-500";
    return "text-red-500";
}

function getHealthGradient(score: number): string {
    if (score >= 80) return "from-green-500 to-green-400";
    if (score >= 50) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-red-400";
}

function getHealthLabel(score: number): string {
    if (score >= 90) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 50) return "Fair";
    if (score >= 30) return "Needs Attention";
    return "Critical";
}

export function VehicleCard({ vehicle, onEdit, onDelete, onUpdateHealth }: VehicleCardProps) {
    const healthColor = getHealthColor(vehicle.healthScore);
    const healthGradient = getHealthGradient(vehicle.healthScore);
    const healthLabel = getHealthLabel(vehicle.healthScore);

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="relative group"
        >
            <div className="bg-card border-2 border-primary/20 hover:border-primary/40 rounded-2xl overflow-hidden shadow-xl shadow-black/20 transition-all duration-300">
                {/* Top accent line */}
                <div className={`h-1 bg-gradient-to-r ${healthGradient}`} />

                {/* Card Content */}
                <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <motion.div
                                className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"
                                whileHover={{ rotate: 5 }}
                            >
                                <Car className="h-6 w-6 text-primary" />
                            </motion.div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">
                                    {vehicle.year} {vehicle.make}
                                </h3>
                                <p className="text-muted-foreground text-sm">{vehicle.model}</p>
                            </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onUpdateHealth(vehicle)}>
                                    <Gauge className="h-4 w-4 mr-2" />
                                    Update Health
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(vehicle)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Vehicle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(vehicle.id)} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Health Score */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {vehicle.healthScore >= 70 ? (
                                    <CheckCircle className={`h-4 w-4 ${healthColor}`} />
                                ) : (
                                    <AlertTriangle className={`h-4 w-4 ${healthColor}`} />
                                )}
                                <span className="text-sm font-medium text-muted-foreground">Health Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-bold ${healthColor}`}>
                                    {vehicle.healthScore}%
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full bg-current/10 ${healthColor}`}>
                                    {healthLabel}
                                </span>
                            </div>
                        </div>

                        {/* Health Bar */}
                        <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full bg-gradient-to-r ${healthGradient} rounded-full`}
                                initial={{ width: 0 }}
                                animate={{ width: `${vehicle.healthScore}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>

                        {/* Health Note */}
                        {vehicle.healthNote && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                                <div className="flex items-start gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {vehicle.healthNote}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center gap-4 pt-2 text-sm text-muted-foreground">
                            {vehicle.mileage && (
                                <div className="flex items-center gap-1">
                                    <Gauge className="h-3.5 w-3.5" />
                                    <span>{vehicle.mileage.toLocaleString()} mi</span>
                                </div>
                            )}
                            {vehicle.color && (
                                <div className="flex items-center gap-1">
                                    <div
                                        className="h-3 w-3 rounded-full border border-border"
                                        style={{ backgroundColor: vehicle.color.toLowerCase() }}
                                    />
                                    <span className="capitalize">{vehicle.color}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
