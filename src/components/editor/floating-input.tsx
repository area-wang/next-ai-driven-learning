/**
 * 通用悬浮输入框组件
 * 用于替换 window.prompt，提供更好的用户体验
 */

"use client"

import * as React from "react"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FloatingInputProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (value: string) => void
  placeholder?: string
  defaultValue?: string
  title?: string
  anchorElement?: HTMLElement | null
}

export function FloatingInput({
  isOpen,
  onClose,
  onSubmit,
  placeholder = "请输入...",
  defaultValue = "",
  title,
  anchorElement,
}: FloatingInputProps) {
  const [value, setValue] = React.useState(defaultValue)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 计算悬浮框位置
  const updatePosition = React.useCallback(() => {
    if (!anchorElement || !containerRef.current) {
      // 如果没有锚点元素，居中显示
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const containerWidth = 400
      const containerHeight = 120
      
      setPosition({
        x: (viewportWidth - containerWidth) / 2,
        y: (viewportHeight - containerHeight) / 2,
      })
      return
    }

    const rect = anchorElement.getBoundingClientRect()
    const containerWidth = 400
    const containerHeight = 120
    const padding = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let x = rect.left
    let y = rect.bottom + padding

    // 检查右边界
    if (x + containerWidth > viewportWidth) {
      x = Math.max(0, viewportWidth - containerWidth - padding)
    }

    // 检查下边界
    if (y + containerHeight > viewportHeight) {
      y = Math.max(0, rect.top - containerHeight - padding)
    }

    setPosition({ x, y })
  }, [anchorElement])

  // 初始化
  React.useEffect(() => {
    if (isOpen) {
      setValue(defaultValue)
      updatePosition()
      
      setTimeout(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      }, 50)
    }
  }, [isOpen, defaultValue, updatePosition])

  // 监听窗口 resize
  React.useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, updatePosition])

  const handleSubmit = () => {
    onSubmit(value)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  const handleClose = () => {
    setValue("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div className="w-[400px] rounded-xl bg-white/95 backdrop-blur-md border-2 border-[var(--color-primary)]/20 shadow-2xl overflow-hidden">
        <div className="p-4">
          {/* 标题 */}
          {title && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          )}

          {/* 输入框 */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "flex-1 px-3 py-2 rounded-lg",
                "border-2 border-[var(--color-primary)]/20 bg-white",
                "focus:border-[var(--color-primary)] focus:outline-none",
                "transition-colors text-sm"
              )}
            />

            {/* 确认按钮 */}
            <button
              onClick={handleSubmit}
              disabled={!value.trim()}
              className={cn(
                "p-2 rounded-lg transition-all flex-shrink-0",
                !value.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white cursor-pointer"
              )}
              title="确认"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>

          {/* 提示文字 */}
          <p className="mt-2 text-xs text-gray-500">
            按 Enter 确认 · 按 Esc 取消
          </p>
        </div>
      </div>
    </div>
  )
}
