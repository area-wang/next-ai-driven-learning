"use client"

import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface SpinnerProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

const sizeClasses = {
  sm: "w-4 h-4",
  default: "w-6 h-6",
  lg: "w-8 h-8",
}

export function Spinner({ className, size = "default" }: SpinnerProps) {
  return (
    <Loader2
      className={cn(
        "animate-spin text-[var(--color-primary)]",
        sizeClasses[size],
        className
      )}
    />
  )
}
