"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Activity, Sparkles, ArrowRight, Bot, Zap, Gauge, Plus, Car } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleModal } from "@/components/VehicleModal";

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

interface DashboardData {
    user: {
        firstName: string | null;
    };
    isPro: boolean;
    subscriptionStatus: string | null;
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{count}</span>;
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "health">("add");
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

    // Fetch dashboard data
    useEffect(() => {
        fetch("/api/profile/update", { method: "GET" })
            .then(res => res.json())
            .then(data => {
                setData({
                    user: { firstName: data.firstName || "Driver" },
                    isPro: data.subscriptionStatus === "active",
                    subscriptionStatus: data.subscriptionStatus
                });
            })
            .catch(() => {
                setData({
                    user: { firstName: "Driver" },
                    isPro: false,
                    subscriptionStatus: null
                });
            })
            .finally(() => setLoading(false));
    }, []);

    // Fetch vehicles
    const fetchVehicles = useCallback(async () => {
        try {
            const res = await fetch("/api/vehicles");
            if (res.ok) {
                const data = await res.json();
                setVehicles(data);
            }
        } catch (error) {
            console.error("Error fetching vehicles:", error);
        } finally {
            setVehiclesLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    // Calculate average health
    const avgHealth = vehicles.length > 0
        ? Math.round(vehicles.reduce((sum, v) => sum + v.healthScore, 0) / vehicles.length)
        : 0;

    // Vehicle actions
    const handleAddVehicle = () => {
        setSelectedVehicle(null);
        setModalMode("add");
        setModalOpen(true);
    };

    const handleEditVehicle = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setModalMode("edit");
        setModalOpen(true);
    };

    const handleUpdateHealth = (vehicle: Vehicle) => {
        setSelectedVehicle(vehicle);
        setModalMode("health");
        setModalOpen(true);
    };

    const handleDeleteVehicle = async (id: string) => {
        if (!confirm("Are you sure you want to delete this vehicle?")) return;

        try {
            const res = await fetch(`/api/vehicles/${id}`, { method: "DELETE" });
            if (res.ok) {
                setVehicles(prev => prev.filter(v => v.id !== id));
            }
        } catch (error) {
            console.error("Error deleting vehicle:", error);
        }
    };

    const handleSaveVehicle = async (vehicleData: Partial<Vehicle>) => {
        if (modalMode === "add") {
            const res = await fetch("/api/vehicles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehicleData),
            });
            if (res.ok) {
                const newVehicle = await res.json();
                setVehicles(prev => [newVehicle, ...prev]);
            }
        } else {
            const res = await fetch(`/api/vehicles/${vehicleData.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vehicleData),
            });
            if (res.ok) {
                const updated = await res.json();
                setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
            }
        }
    };

    const isPro = data?.isPro ?? false;
    const subscriptionStatus = data?.subscriptionStatus;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Gauge className="h-12 w-12 text-primary" />
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Hero Section */}
            <motion.div variants={itemVariants} className="flex justify-between items-start">
                <div className="space-y-2">
                    <motion.h1
                        className="text-4xl md:text-5xl font-extrabold tracking-tight"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <span className="gradient-text-animated">Vehicle Command Center</span>
                    </motion.h1>
                    <motion.p
                        className="text-xl text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Welcome back, <span className="text-foreground font-medium">{data?.user.firstName}</span>.
                        {vehicles.length > 0 ? (
                            <>
                                {" "}Fleet health: <span className={avgHealth >= 70 ? "text-green-500" : avgHealth >= 40 ? "text-yellow-500" : "text-red-500"} style={{ fontWeight: 700 }}>{avgHealth}%</span>
                            </>
                        ) : (
                            <> Add your first vehicle to get started.</>
                        )}
                    </motion.p>
                </div>
                {isPro && (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
                        className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border border-primary/30 shadow-lg shadow-primary/10"
                    >
                        <Sparkles className="h-4 w-4 animate-pulse" />
                        Premium Member
                    </motion.div>
                )}
            </motion.div>

            {/* Stats Row */}
            <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
                {[
                    { label: "Fleet Health", value: avgHealth, suffix: "%", icon: Activity, color: avgHealth >= 70 ? "text-green-500" : avgHealth >= 40 ? "text-yellow-500" : "text-red-500" },
                    { label: "Vehicles", value: vehicles.length, suffix: "", icon: Car, color: "text-primary" },
                    { label: "Diagnostics Available", value: isPro ? 999 : 5, suffix: "", icon: Zap, color: "text-accent" },
                ].map((stat) => (
                    <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, y: -2 }}
                        className="relative overflow-hidden"
                    >
                        <Card className="bg-card border-primary/20">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className={`text-3xl font-bold ${stat.color}`}>
                                            <AnimatedCounter value={stat.value} />
                                            {stat.suffix}
                                        </p>
                                    </div>
                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${stat.color}`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* My Garage Section */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-foreground">My Garage</h2>
                        <p className="text-muted-foreground text-sm">Manage your vehicles and track their health</p>
                    </div>
                    <Button variant="garage" onClick={handleAddVehicle}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Vehicle
                    </Button>
                </div>

                {vehiclesLoading ? (
                    <div className="flex justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                            <Gauge className="h-8 w-8 text-primary" />
                        </motion.div>
                    </div>
                ) : vehicles.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12 border-2 border-dashed border-border/50 rounded-2xl bg-card/50"
                    >
                        <Car className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No vehicles yet</h3>
                        <p className="text-muted-foreground mb-4">Add your first vehicle to start tracking its health</p>
                        <Button variant="garage" onClick={handleAddVehicle}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Your First Vehicle
                        </Button>
                    </motion.div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {vehicles.map((vehicle, index) => (
                                <motion.div
                                    key={vehicle.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <VehicleCard
                                        vehicle={vehicle}
                                        onEdit={handleEditVehicle}
                                        onDelete={handleDeleteVehicle}
                                        onUpdateHealth={handleUpdateHealth}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Quick Actions Row */}
            <motion.div variants={itemVariants} className="grid gap-6 md:grid-cols-2">
                {/* AI Mechanic Card */}
                <Link href="/dashboard/advisor" className="group">
                    <motion.div
                        whileHover={{ scale: 1.02, y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400 }}
                    >
                        <Card className="h-full border-2 border-primary/20 hover:border-primary/50 bg-gradient-to-br from-primary/10 via-card to-accent/10 cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Sparky ⚡
                                </CardTitle>
                                <motion.div
                                    className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                                    whileHover={{ rotate: 10, scale: 1.1 }}
                                >
                                    <Bot className="h-7 w-7 text-white" />
                                </motion.div>
                            </CardHeader>
                            <CardContent className="relative z-10">
                                <div className="text-3xl font-extrabold mb-2 text-foreground">AI Advisor</div>
                                <p className="text-base text-muted-foreground">
                                    Diagnose issues, estimate repairs, and get instant DIY guides.
                                </p>
                            </CardContent>
                            <CardFooter className="relative z-10">
                                <Button variant="garage" className="w-full group">
                                    Start Diagnosis
                                    <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </Link>

                {/* Plan Status Card */}
                <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ type: "spring", stiffness: 400 }}
                >
                    <Card className="h-full border-primary/20 bg-card">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold text-foreground">Plan Status</CardTitle>
                            <motion.div
                                className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center"
                                whileHover={{ scale: 1.1 }}
                            >
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </motion.div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-1 capitalize text-foreground">
                                {subscriptionStatus === 'active' ? 'Pro Plan' : 'Free Tier'}
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {subscriptionStatus === 'active'
                                    ? 'Unlimited AI diagnostics enabled.'
                                    : 'Upgrade for unlimited diagnostics.'}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-muted-foreground">Daily Queries</span>
                                    <span className="text-foreground">{subscriptionStatus === 'active' ? '∞' : '3 / 5'}</span>
                                </div>
                                <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${subscriptionStatus === 'active' ? 'bg-gradient-to-r from-primary to-accent' : 'bg-gradient-to-r from-yellow-500 to-orange-500'}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: subscriptionStatus === 'active' ? '100%' : '60%' }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.7 }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {isPro ? (
                                <Link href="/dashboard/billing" className="w-full">
                                    <Button variant="outline" className="w-full">Manage Subscription</Button>
                                </Link>
                            ) : (
                                <form action="/api/stripe/checkout" method="POST" className="w-full">
                                    <Button type="submit" variant="garage" className="w-full">
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Upgrade to Pro
                                    </Button>
                                </form>
                            )}
                        </CardFooter>
                    </Card>
                </motion.div>
            </motion.div>

            {/* Vehicle Modal */}
            <VehicleModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveVehicle}
                vehicle={selectedVehicle}
                mode={modalMode}
            />
        </motion.div>
    );
}
