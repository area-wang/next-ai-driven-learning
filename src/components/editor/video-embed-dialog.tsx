/**
 * 视频嵌入对话框
 * 支持 YouTube 和 Vimeo 链接
 */

"use client"

import * as React from "react"
import { X, Video } from "lucide-react"
import { cn } from "@/lib/utils"

export interface VideoEmbedDialogProps {
  isOpen: boolean
  onClose: () => void
  onEmbed: (url: string, type: 'youtube' | 'vimeo') => void
}

/**
 * 解析 YouTube URL
 * 支持格式：
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 */
function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 解析 Vimeo URL
 * 支持格式：
 * - https://vimeo.com/VIDEO_ID
 * - https://player.vimeo.com/video/VIDEO_ID
 */
function parseVimeoUrl(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

/**
 * 检测视频类型
 */
function detectVideoType(url: string): 'youtube' | 'vimeo' | null {
  if (parseYouTubeUrl(url)) {
    return 'youtube'
  }
  if (parseVimeoUrl(url)) {
    return 'vimeo'
  }
  return null
}

export function VideoEmbedDialog({
  isOpen,
  onClose,
  onEmbed,
}: VideoEmbedDialogProps) {
  const [url, setUrl] = React.useState("")
  const [error, setError] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!url.trim()) {
      setError("请输入视频链接")
      return
    }

    const type = detectVideoType(url)
    if (!type) {
      setError("不支持的视频链接格式。请使用 YouTube 或 Vimeo 链接")
      return
    }

    onEmbed(url, type)
    setUrl("")
    onClose()
  }

  const handleClose = () => {
    setUrl("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-md mx-4",
          "rounded-2xl border-[3px] border-blue-200 bg-blue-50/95 backdrop-blur-md p-6",
          "shadow-[4px_4px_12px_rgba(0,0,0,0.1),-2px_-2px_8px_rgba(255,255,255,0.8)]"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={handleClose}
          className={cn(
            "absolute top-4 right-4 p-2 rounded-lg",
            "text-slate-600 hover:text-slate-900 hover:bg-white/50",
            "transition-colors duration-200 cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500"
          )}
          aria-label="关闭"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-100">
            <Video className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">嵌入视频</h2>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="video-url"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              视频链接
            </label>
            <input
              id="video-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={cn(
                "w-full px-4 py-2 rounded-lg",
                "border-2 border-blue-200 bg-white",
                "text-slate-900 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                "transition-all duration-200"
              )}
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* 支持的平台提示 */}
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-medium">支持的平台：</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>YouTube (youtube.com, youtu.be)</li>
              <li>Vimeo (vimeo.com)</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "border-2 border-slate-200 bg-white",
                "text-slate-700 font-medium",
                "hover:bg-slate-50 transition-colors duration-200 cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-slate-500"
              )}
            >
              取消
            </button>
            <button
              type="submit"
              className={cn(
                "flex-1 px-4 py-2 rounded-lg",
                "bg-blue-600 text-white font-medium",
                "hover:bg-blue-700 transition-colors duration-200 cursor-pointer",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              disabled={!url.trim()}
            >
              嵌入
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
