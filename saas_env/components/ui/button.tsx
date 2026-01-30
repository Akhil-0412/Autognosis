import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
    "transition-all duration-300 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "active:scale-[0.98]",
    "relative overflow-hidden",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/25",
          "hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30",
          "hover:-translate-y-0.5",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700",
        ].join(" "),
        destructive: [
          "bg-destructive text-white",
          "shadow-lg shadow-destructive/25",
          "hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/30",
          "hover:-translate-y-0.5",
        ].join(" "),
        outline: [
          "border-2 bg-background/50 backdrop-blur-sm",
          "shadow-sm hover:shadow-md",
          "hover:bg-primary/10 hover:border-primary/50 hover:text-primary",
          "hover:-translate-y-0.5",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-sm",
          "hover:bg-secondary/80 hover:shadow-md",
          "hover:-translate-y-0.5",
        ].join(" "),
        ghost: [
          "hover:bg-accent/50 hover:text-accent-foreground",
          "hover:backdrop-blur-sm",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline",
        glow: [
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/40",
          "hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]",
          "hover:-translate-y-1",
          "border border-primary/50",
        ].join(" "),
        neon: [
          "bg-transparent text-primary",
          "border-2 border-primary",
          "shadow-[0_0_15px_rgba(59,130,246,0.3),inset_0_0_15px_rgba(59,130,246,0.1)]",
          "hover:shadow-[0_0_25px_rgba(59,130,246,0.5),inset_0_0_25px_rgba(59,130,246,0.2)]",
          "hover:bg-primary/10",
          "hover:-translate-y-0.5",
        ].join(" "),
        garage: [
          "bg-gradient-to-r from-primary to-accent text-white",
          "shadow-lg",
          "hover:shadow-xl hover:shadow-primary/30",
          "hover:-translate-y-1 hover:scale-105",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
          "before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-500",
        ].join(" "),
      },
      size: {
        default: "h-10 px-5 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-12 rounded-lg px-8 text-base has-[>svg]:px-6",
        xl: "h-14 rounded-xl px-10 text-lg has-[>svg]:px-8",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
