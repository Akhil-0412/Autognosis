"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Activity, ShieldCheck, ChevronRight, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { GarageBackground } from "@/components/GarageBackground";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden text-foreground">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <GarageBackground />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center px-6 lg:px-12 border-b border-primary/10 bg-black/20 backdrop-blur-xl">
        <Link className="flex items-center gap-3 group" href="#">
          <div className="relative h-10 w-10 overflow-hidden rounded-full shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
            <Image
              src="/logo.png"
              alt="Autognosis Logo"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <span className="font-bold text-xl tracking-tight gradient-text-animated">Autognosis</span>
        </Link>
        <nav className="ml-auto flex gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]" href="#">
            Features
          </Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors text-muted-foreground" href="#">
            Pricing
          </Link>
          <Link href="/dashboard">
            <Button variant="garage" size="sm" className="hidden sm:flex">
              Login
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 relative z-10 pt-20">
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-48 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 max-w-4xl"
          >
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-md mb-4">
              <Zap className="mr-2 h-3.5 w-3.5" />
              <span>v2.0 Now Available with AI Diagnostics</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight">
              Your Vehicle's <br />
              <span className="bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                Intelligence Hub
              </span>
            </h1>

            <p className="mx-auto max-w-[700px] text-gray-400 md:text-xl leading-relaxed">
              Connect your fleet to the future. Real-time health monitoring, AI-powered diagnostics, and predictive maintenance in one stunning dashboard.
            </p>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-105">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#">
                <Button variant="outline" size="lg" className="h-12 px-8 text-lg border-primary/20 hover:bg-primary/10 hover:text-primary backdrop-blur-sm">
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-24 px-4 md:px-6 relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

          <div className="container mx-auto">
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Bot className="h-8 w-8 text-cyan-400" />}
                title="AI Mechanic"
                description="Sparky analyzes sounds and symptoms instantly. Just ask, 'What's that clicking noise?'"
                delay={0.1}
              />
              <FeatureCard
                icon={<Activity className="h-8 w-8 text-green-400" />}
                title="Health Monitoring"
                description="Track vital stats like battery voltage, engine temperature, and tire pressure in real-time."
                delay={0.2}
              />
              <FeatureCard
                icon={<ShieldCheck className="h-8 w-8 text-purple-400" />}
                title="Predictive Care"
                description="Get alerts before breakdowns happen. Smart usage tracking prevents costly repairs."
                delay={0.3}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 py-8 border-t border-primary/10 bg-black/40 backdrop-blur-xl">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative h-6 w-6 overflow-hidden rounded-full">
              <Image
                src="/logo.png"
                alt="Autognosis Logo"
                width={24}
                height={24}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Autognosis. All rights reserved.
            </p>
          </div>
          <nav className="flex gap-6">
            <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">
              Privacy Policy
            </Link>
            <Link className="text-xs text-muted-foreground hover:text-primary transition-colors" href="#">
              Terms of Service
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
      className="group relative rounded-2xl border border-primary/10 bg-black/40 p-8 backdrop-blur-md transition-all hover:border-primary/30 hover:bg-black/60 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
    >
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
        {icon}
      </div>
      <h3 className="mb-3 text-xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}
