import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Base styles
        "h-11 w-full min-w-0 rounded-lg border px-4 py-2 text-base",
        "bg-muted/50 text-foreground",
        "border-border/50",
        "placeholder:text-muted-foreground",
        "shadow-sm shadow-black/10",

        // Transitions
        "transition-all duration-300 ease-out",

        // Focus states with glow
        "focus:outline-none",
        "focus:border-primary/60",
        "focus:ring-2 focus:ring-primary/30",
        "focus:shadow-[0_0_20px_rgba(59,130,246,0.2)]",
        "focus:bg-background",

        // Hover state
        "hover:border-primary/40",
        "hover:shadow-md hover:shadow-black/20",

        // Selection
        "selection:bg-primary selection:text-primary-foreground",

        // File input styling
        "file:text-foreground file:inline-flex file:h-8 file:border-0",
        "file:bg-primary/20 file:text-primary file:text-sm file:font-medium",
        "file:rounded-md file:px-3 file:mr-3",
        "file:hover:bg-primary/30 file:transition-colors",

        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",

        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-destructive/30",

        className
      )}
      {...props}
    />
  )
}

export { Input }
