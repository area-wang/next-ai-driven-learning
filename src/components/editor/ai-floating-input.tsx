"use client"

import * as React from "react"
import { Loader2, Send, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AIFloatingInputProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (prompt: string) => Promise<void>
  anchorElement?: HTMLElement | null  // 记录 /AI 指令的位置元素
}

export function AIFloatingInput({
  isOpen,
  onClose,
  onGenerate,
  anchorElement,
}: AIFloatingInputProps) {
  const [prompt, setPrompt] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // 计算悬浮框位置（紧跟唤起位置，确保在视口内）
  const updatePosition = React.useCallback(() => {
    if (!anchorElement || !containerRef.current) return

    const rect = anchorElement.getBoundingClientRect()
    const containerWidth = 448 // w-[28rem] = 28rem = 448px
    const containerHeight = 280 // 估计高度
    const padding = 8
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // 默认跟随唤起位置
    let x = rect.left
    let y = rect.bottom + padding

    // 检查右边界，如果超出则左移
    if (x + containerWidth > viewportWidth) {
      x = Math.max(0, viewportWidth - containerWidth - padding)
    }

    // 检查下边界，如果超出则显示在上方
    if (y + containerHeight > viewportHeight) {
      y = Math.max(0, rect.top - containerHeight - padding)
    }

    setPosition({ x, y })
  }, [anchorElement])

  // 初始化位置和禁止滚动
  React.useEffect(() => {
    if (isOpen && anchorElement) {
      updatePosition()
      
      // 禁止页面和编辑器滚动
      const originalBodyOverflow = document.body.style.overflow
      const originalHtmlOverflow = document.documentElement.style.overflow
      
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      
      // 查找所有可能的编辑器容器并禁止滚动
      const editorContainers = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]')
      const originalOverflows: Array<{ element: Element; overflow: string }> = []
      
      editorContainers.forEach((container) => {
        originalOverflows.push({
          element: container,
          overflow: (container as HTMLElement).style.overflow || '',
        })
        ;(container as HTMLElement).style.overflow = 'hidden'
      })
      
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      
      return () => {
        // 恢复页面和编辑器滚动
        document.body.style.overflow = originalBodyOverflow
        document.documentElement.style.overflow = originalHtmlOverflow
        
        originalOverflows.forEach(({ element, overflow }) => {
          ;(element as HTMLElement).style.overflow = overflow
        })
      }
    }
  }, [isOpen, anchorElement, updatePosition])

  // 监听窗口 resize 事件，更新悬浮框位置
  React.useEffect(() => {
    if (!isOpen || !anchorElement) return

    const handleResize = () => {
      updatePosition()
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, anchorElement, updatePosition])

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      await onGenerate(prompt)
      setPrompt("")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleGenerate()
    }
    if (e.key === "Escape") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50 pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {/* 悬浮输入框容器 */}
      <div className="w-[28rem] rounded-2xl bg-white/95 backdrop-blur-md border-2 border-[var(--color-primary)]/20 shadow-2xl overflow-hidden">
        {/* 内容 */}
        <div className="p-3">
          {/* 输入框和按钮 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入提示词... (Enter 发送 · Esc 关闭)"
                className="w-full px-3 py-2 rounded-lg border-2 border-[var(--color-primary)]/20 bg-white focus:border-[var(--color-primary)] focus:outline-none transition-colors text-sm"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                </div>
              )}
            </div>
            
            {/* 发送按钮 */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className={cn(
                "p-2 rounded-lg transition-all flex-shrink-0",
                isLoading || !prompt.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white cursor-pointer"
              )}
              title="发送"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
              disabled={isLoading}
              title="关闭"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
