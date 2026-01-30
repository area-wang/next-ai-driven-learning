/**
 * 图片插入对话框
 * 支持上传本地图片和插入在线图片 URL
 */

"use client"

import * as React from "react"
import { X, Image, Upload, Link } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ImageInsertDialogProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (src: string, alt?: string) => void
}

export function ImageInsertDialog({
  isOpen,
  onClose,
  onInsert,
}: ImageInsertDialogProps) {
  const [mode, setMode] = React.useState<'url' | 'upload'>('url')
  const [url, setUrl] = React.useState("")
  const [alt, setAlt] = React.useState("")
  const [error, setError] = React.useState("")
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (mode === 'url') {
      if (!url.trim()) {
        setError("请输入图片链接")
        return
      }

      // 简单验证 URL 格式
      try {
        new URL(url)
      } catch {
        setError("请输入有效的图片链接")
        return
      }

      onInsert(url, alt || undefined)
      setUrl("")
      setAlt("")
      onClose()
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setIsUploading(true)

    try {
      // 上传图片
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json() as { url: string }

      onInsert(data.url, alt || file.name)
      setUrl("")
      setAlt("")
      onClose()
    } catch (error) {
      console.error('图片上传失败:', error)
      setError('图片上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setUrl("")
    setAlt("")
    setError("")
    setMode('url')
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
            <Image className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900">插入图片</h2>
        </div>

        {/* 模式切换 */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
              "border-2 transition-all duration-200 cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              mode === 'url'
                ? "border-blue-500 bg-blue-100 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <Link className="w-4 h-4" />
            <span className="font-medium">在线图片</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg",
              "border-2 transition-all duration-200 cursor-pointer",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              mode === 'upload'
                ? "border-blue-500 bg-blue-100 text-blue-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">上传图片</span>
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'url' ? (
            <>
              <div>
                <label
                  htmlFor="image-url"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  图片链接
                </label>
                <input
                  id="image-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className={cn(
                    "w-full px-4 py-2 rounded-lg",
                    "border-2 border-blue-200 bg-white",
                    "text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "transition-all duration-200"
                  )}
                  autoFocus
                />
              </div>

              <div>
                <label
                  htmlFor="image-alt"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  图片描述（可选）
                </label>
                <input
                  id="image-alt"
                  type="text"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                  placeholder="图片的描述文字"
                  className={cn(
                    "w-full px-4 py-2 rounded-lg",
                    "border-2 border-blue-200 bg-white",
                    "text-slate-900 placeholder:text-slate-400",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                    "transition-all duration-200"
                  )}
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                选择图片文件
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "w-full px-4 py-8 rounded-lg",
                  "border-2 border-dashed border-blue-300 bg-white",
                  "text-slate-700 hover:bg-blue-50",
                  "transition-all duration-200 cursor-pointer",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "flex flex-col items-center gap-2"
                )}
              >
                <Upload className="w-8 h-8 text-blue-600" />
                <span className="font-medium">
                  {isUploading ? '上传中...' : '点击选择图片'}
                </span>
                <span className="text-xs text-slate-500">
                  支持 JPG、PNG、GIF、WebP 等格式
                </span>
              </button>

              {alt && (
                <div className="mt-3">
                  <label
                    htmlFor="upload-alt"
                    className="block text-sm font-medium text-slate-700 mb-2"
                  >
                    图片描述（可选）
                  </label>
                  <input
                    id="upload-alt"
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    placeholder="图片的描述文字"
                    className={cn(
                      "w-full px-4 py-2 rounded-lg",
                      "border-2 border-blue-200 bg-white",
                      "text-slate-900 placeholder:text-slate-400",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "transition-all duration-200"
                    )}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* 提示信息 */}
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-medium">💡 提示：</p>
            <ul className="ml-2 space-y-0.5">
              <li>• 在线图片：直接粘贴图片 URL 即可</li>
              <li>• 上传图片：支持拖拽或点击选择本地图片</li>
              <li>• 图片描述用于无障碍访问和 SEO 优化</li>
            </ul>
          </div>

          {/* 按钮 */}
          {mode === 'url' && (
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
                插入
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
