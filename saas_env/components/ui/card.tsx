import * as React from "react"

import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        // Base styles
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl py-6",
        // Border with glow effect
        "border border-primary/20",
        "shadow-xl shadow-black/20",
        // Transitions
        "transition-all duration-300 ease-out",
        // Hover effects
        "hover:border-primary/40",
        "hover:shadow-2xl hover:shadow-primary/10",
        "hover:-translate-y-1",
        // Relative for overlays
        "relative overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        "leading-none font-bold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

// Enhanced card with neon border glow
function GlowCard({ className, glowColor = "primary", ...props }: React.ComponentProps<"div"> & { glowColor?: "primary" | "accent" | "destructive" }) {
  const glowStyles = {
    primary: "border-primary/40 hover:border-primary shadow-lg shadow-primary/10 hover:shadow-primary/25",
    accent: "border-accent/40 hover:border-accent shadow-lg shadow-accent/10 hover:shadow-accent/25",
    destructive: "border-destructive/40 hover:border-destructive shadow-lg shadow-destructive/10 hover:shadow-destructive/25",
  }

  return (
    <div
      data-slot="glow-card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl py-6",
        "border-2",
        "transition-all duration-500 ease-out",
        "hover:shadow-2xl hover:-translate-y-2",
        "relative overflow-hidden group",
        glowStyles[glowColor],
        className
      )}
      {...props}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      {props.children}
    </div>
  )
}

function FeatureCard({ className, icon, ...props }: React.ComponentProps<"div"> & { icon?: React.ReactNode }) {
  return (
    <div
      data-slot="feature-card"
      className={cn(
        "bg-gradient-to-br from-card via-card to-primary/5 text-card-foreground",
        "flex flex-col gap-4 rounded-2xl border-2 border-primary/30 py-8 px-6",
        "shadow-xl shadow-black/20",
        "transition-all duration-500 ease-out",
        "hover:border-primary/60 hover:shadow-2xl hover:shadow-primary/15",
        "hover:-translate-y-2 hover:scale-[1.02]",
        "relative overflow-hidden group cursor-pointer",
        className
      )}
      {...props}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      {/* Icon section */}
      {icon && (
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 scale-150" />
          {icon}
        </div>
      )}
      {props.children}
    </div>
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  GlowCard,
  FeatureCard,
}
