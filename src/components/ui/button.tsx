"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-lg shadow-[var(--color-primary)]/20 focus-visible:ring-[var(--color-primary)]",
        cta:
          "bg-[var(--color-cta)] text-white hover:bg-[var(--color-cta-hover)] shadow-xl shadow-[var(--color-cta)]/30 hover:shadow-2xl hover:shadow-[var(--color-cta)]/40 hover:-translate-y-0.5 focus-visible:ring-[var(--color-cta)]",
        secondary:
          "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-secondary)]/80 focus-visible:ring-[var(--color-secondary)]",
        glass:
          "bg-white/80 backdrop-blur-md border border-white/20 text-[var(--color-primary)] hover:bg-white/90 focus-visible:ring-[var(--color-primary)]",
        outline:
          "border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white focus-visible:ring-[var(--color-primary)]",
        ghost:
          "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 focus-visible:ring-[var(--color-primary)]",
        link:
          "text-[var(--color-primary)] underline-offset-4 hover:underline focus-visible:ring-[var(--color-primary)]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-sm",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
