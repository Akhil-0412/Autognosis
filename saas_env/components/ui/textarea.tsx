import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
    extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    // Base styles
                    "flex min-h-[100px] w-full rounded-lg border px-4 py-3 text-base",
                    "bg-muted/50 text-foreground",
                    "border-border/50",
                    "placeholder:text-muted-foreground",
                    "shadow-sm shadow-black/10",
                    "resize-none",

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

                    // Disabled
                    "disabled:cursor-not-allowed disabled:opacity-50",

                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
