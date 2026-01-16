"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipContextValue {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | undefined>(undefined)

function useTooltip() {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("Tooltip components must be used within a Tooltip provider")
  }
  return context
}

interface TooltipProps {
  children: React.ReactNode
  delayDuration?: number
}

function Tooltip({ children, delayDuration = 200 }: TooltipProps) {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = React.useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(true), delayDuration)
  }, [delayDuration])

  const handleClose = React.useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(false)
  }, [])

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <div
        className="relative inline-block"
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        onFocus={handleOpen}
        onBlur={handleClose}
      >
        {children}
      </div>
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("inline-block", className)} {...props} />
))
TooltipTrigger.displayName = "TooltipTrigger"

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom" | "left" | "right"
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = "top", ...props }, ref) => {
    const { open } = useTooltip()

    if (!open) return null

    const sideClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    }

    return (
      <div
        ref={ref}
        role="tooltip"
        className={cn(
          "absolute z-50 px-3 py-1.5 text-sm rounded-md",
          "bg-[var(--color-text)] text-white shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          sideClasses[side],
          className
        )}
        {...props}
      />
    )
  }
)
TooltipContent.displayName = "TooltipContent"

function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
