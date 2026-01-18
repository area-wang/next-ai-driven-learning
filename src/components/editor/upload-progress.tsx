/**
 * 上传进度提示组件
 * 使用 Claymorphism 风格显示上传状态
 */

"use client"

import * as React from "react"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface UploadProgressProps {
  fileName: string
  status: 'uploading' | 'success' | 'error'
  error?: string
  onClose?: () => void
}

export function UploadProgress({
  fileName,
  status,
  error,
  onClose,
}: UploadProgressProps) {
  // 自动关闭成功提示
  React.useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onClose?.()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [status, onClose])

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "rounded-2xl border-[3px] p-4 min-w-[300px] max-w-[400px]",
        "backdrop-blur-md transition-all duration-200",
        "shadow-[4px_4px_12px_rgba(0,0,0,0.1),-2px_-2px_8px_rgba(255,255,255,0.8)]",
        status === 'uploading' && "bg-blue-50/90 border-blue-200",
        status === 'success' && "bg-green-50/90 border-green-200",
        status === 'error' && "bg-red-50/90 border-red-200"
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start gap-3">
        {/* 状态图标 */}
        <div className="flex-shrink-0 mt-0.5">
          {status === 'uploading' && (
            <Loader2
              className="w-5 h-5 text-blue-600 animate-spin"
              aria-label="上传中"
            />
          )}
          {status === 'success' && (
            <CheckCircle2
              className="w-5 h-5 text-green-600"
              aria-label="上传成功"
            />
          )}
          {status === 'error' && (
            <XCircle
              className="w-5 h-5 text-red-600"
              aria-label="上传失败"
            />
          )}
        </div>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {fileName}
          </p>
          <p
            className={cn(
              "text-xs mt-1",
              status === 'uploading' && "text-blue-600",
              status === 'success' && "text-green-600",
              status === 'error' && "text-red-600"
            )}
          >
            {status === 'uploading' && '正在上传...'}
            {status === 'success' && '上传成功'}
            {status === 'error' && (error || '上传失败')}
          </p>
        </div>

        {/* 关闭按钮 */}
        {(status === 'success' || status === 'error') && (
          <button
            onClick={onClose}
            className={cn(
              "flex-shrink-0 p-1 rounded-lg transition-colors duration-200",
              "hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-offset-2",
              status === 'success' && "focus:ring-green-500",
              status === 'error' && "focus:ring-red-500"
            )}
            aria-label="关闭"
          >
            <XCircle className="w-4 h-4 text-slate-400" />
          </button>
        )}
      </div>
    </div>
  )
}
