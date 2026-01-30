"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, CreditCard, Settings, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { GarageBackground } from "@/components/GarageBackground";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
    { href: "/dashboard/advisor", label: "Sparky Advisor", icon: Bot },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="flex min-h-screen font-sans relative">
            {/* Animated Background */}
            <GarageBackground />

            {/* Sidebar */}
            <aside className="hidden w-72 flex-col border-r border-primary/10 bg-black/40 backdrop-blur-xl sm:flex fixed h-full z-40">
                {/* Logo Section */}
                <div className="flex h-20 items-center border-b border-primary/10 px-4">
                    <Link href="/" className="flex items-center gap-3 group">
                        <motion.div
                            className="h-14 w-14 rounded-full overflow-hidden shadow-lg shadow-primary/30"
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Image
                                src="/logo.png"
                                alt="Autognosis Logo"
                                width={56}
                                height={56}
                                className="object-cover"
                            />
                        </motion.div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold tracking-tight gradient-text-animated">
                                AUTOGNOSIS
                            </span>
                            <span className="text-xs text-muted-foreground">
                                AI Car Chat • Sparky
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    {navItems.map((item, index) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium
                                        transition-all duration-300 ease-out group relative overflow-hidden
                                        ${isActive
                                            ? "bg-primary/20 text-primary shadow-lg shadow-primary/10"
                                            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                        }
                                    `}
                                >
                                    {/* Active indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeIndicator"
                                            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}

                                    {/* Hover glow effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <motion.div
                                        className={`
                                            h-9 w-9 rounded-lg flex items-center justify-center
                                            transition-all duration-300
                                            ${isActive
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                                                : "bg-muted/50 group-hover:bg-primary/20 group-hover:text-primary"
                                            }
                                        `}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </motion.div>
                                    <span className="relative z-10">{item.label}</span>
                                </Link>
                            </motion.div>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="p-4 border-t border-primary/10">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/30 backdrop-blur-sm">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-muted-foreground">System Online</span>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-col sm:pl-72 w-full">
                {/* Header */}
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-primary/10 bg-black/30 backdrop-blur-xl px-6">
                    <div className="flex-1" />
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4"
                    >
                        {/* Status indicator */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-medium text-green-500">Connected</span>
                        </div>

                        <div className="h-8 w-px bg-border" />

                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/50 transition-all"
                                }
                            }}
                        />
                    </motion.div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-6 md:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
