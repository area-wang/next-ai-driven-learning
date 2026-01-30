import * as React from "react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'left' | 'right'
  width?: number
  onWidthChange?: (width: number) => void
}

export function Drawer({ open, onOpenChange, children, side = 'right', width = 600, onWidthChange }: DrawerProps) {
  const [currentWidth, setCurrentWidth] = React.useState(width)
  const isDraggingRef = React.useRef(false)
  const startXRef = React.useRef(0)
  const startWidthRef = React.useRef(0)

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    isDraggingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = currentWidth
    
    // 设置拖拽时的样式
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.body.style.pointerEvents = 'none'
  }, [currentWidth])

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      
      e.preventDefault()
      
      // 计算拖拽距离
      const deltaX = e.clientX - startXRef.current
      
      // 根据方向计算新宽度
      let newWidth: number
      if (side === 'left') {
        // 左侧：向右拖增加宽度
        newWidth = startWidthRef.current + deltaX
      } else {
        // 右侧：向左拖增加宽度
        newWidth = startWidthRef.current - deltaX
      }
      
      // 限制最小和最大宽度
      const minWidth = 400
      const maxWidth = window.innerWidth - 100 // 留出 100px 空间
      newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth))
      
      setCurrentWidth(newWidth)
      onWidthChange?.(newWidth)
    }

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return
      
      isDraggingRef.current = false
      
      // 恢复样式
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [side, onWidthChange])

  if (!open) return null

  return (
    <>
      {/* 抽屉内容 */}
      <div 
        className={cn(
          "fixed top-0 bottom-0 z-50 shadow-2xl bg-white",
          side === 'left' ? 'left-0' : 'right-0'
        )}
        style={{ width: `${currentWidth}px` }}
      >
        {children}
        
        {/* 拖拽手柄 - 在抽屉内部边缘 */}
        <div
          className={cn(
            "absolute top-0 bottom-0 w-1 cursor-col-resize z-10 group",
            side === 'left' ? 'right-0' : 'left-0'
          )}
          onMouseDown={handleMouseDown}
        >
          {/* 扩大点击区域 */}
          <div className="absolute inset-y-0 -left-2 -right-2 hover:bg-primary/10 transition-colors" />
          
          {/* 可视指示器 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-gray-400 rounded-full group-hover:bg-primary transition-colors pointer-events-none" />
        </div>
      </div>
    </>
  )
}

interface DrawerContentProps {
  className?: string
  children: React.ReactNode
  side?: 'left' | 'right'
}

export function DrawerContent({ className, children, side = 'right' }: DrawerContentProps) {
  const animationClass = side === 'left' 
    ? 'animate-in slide-in-from-left duration-300' 
    : 'animate-in slide-in-from-right duration-300'

  return (
    <div
      className={cn(
        "h-full bg-white shadow-xl flex flex-col",
        animationClass,
        className
      )}
    >
      {children}
    </div>
  )
}

interface DrawerHeaderProps {
  className?: string
  children: React.ReactNode
}

export function DrawerHeader({ className, children }: DrawerHeaderProps) {
  return (
    <div className={cn("px-6 py-4 border-b", className)}>
      {children}
    </div>
  )
}

interface DrawerTitleProps {
  className?: string
  children: React.ReactNode
}

export function DrawerTitle({ className, children }: DrawerTitleProps) {
  return (
    <h2 className={cn("text-lg font-semibold", className)}>
      {children}
    </h2>
  )
}

interface DrawerBodyProps {
  className?: string
  children: React.ReactNode
}

export function DrawerBody({ className, children }: DrawerBodyProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto", className)}>
      {children}
    </div>
  )
}

interface DrawerFooterProps {
  className?: string
  children: React.ReactNode
}

export function DrawerFooter({ className, children }: DrawerFooterProps) {
  return (
    <div className={cn("px-6 py-4 border-t bg-gray-50 relative z-10", className)}>
      {children}
    </div>
  )
}
