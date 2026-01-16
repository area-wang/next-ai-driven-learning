"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-lg text-[var(--color-text)] transition-all duration-200 placeholder:text-[var(--color-text-muted)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default:
          "bg-white/90 backdrop-blur-sm border border-[var(--color-secondary)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
        glass:
          "bg-white/60 backdrop-blur-md border border-white/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
        outline:
          "bg-transparent border-2 border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant }), "px-4 py-3", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
