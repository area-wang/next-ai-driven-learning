"use client"

import * as React from "react"
import { Upload, X, Loader2, Image as ImageIcon, Video, Music } from "lucide-react"
import { uploadFile, type UploadResult } from "@/lib/storage/upload"
import { cn } from "@/lib/utils"

export interface MediaUploaderProps {
  onUpload: (result: UploadResult) => void
  onError?: (error: Error) => void
  accept?: string
  maxSize?: number
  className?: string
}

export function MediaUploader({
  onUpload,
  onError,
  accept = "image/*,video/*,audio/*",
  maxSize = 100 * 1024 * 1024, // 100MB
  className,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    setIsUploading(true)
    setUploadProgress(0)

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90))
      }, 200)

      const result = await uploadFile(file, {
        maxSize,
        compress: true,
        generateThumbnail: true,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // 延迟一下让用户看到 100%
      setTimeout(() => {
        onUpload(result)
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (error) {
      setIsUploading(false)
      setUploadProgress(0)
      const err = error instanceof Error ? error : new Error('上传失败')
      onError?.(err)
      console.error('上传失败:', error)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    handleFileSelect(files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const getFileTypeIcon = () => {
    if (accept.includes('image')) return <ImageIcon className="w-8 h-8" />
    if (accept.includes('video')) return <Video className="w-8 h-8" />
    if (accept.includes('audio')) return <Music className="w-8 h-8" />
    return <Upload className="w-8 h-8" />
  }

  return (
    <div className={cn("relative", className)}>
      {/* Claymorphism 风格的上传区域 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          "relative flex flex-col items-center justify-center",
          "min-h-[200px] p-8 rounded-3xl cursor-pointer",
          "bg-white/90 border-[3px] transition-all duration-200 ease-out",
          // Claymorphism: 双阴影效果
          "shadow-[0_4px_12px_rgba(13,148,136,0.1),0_8px_24px_rgba(13,148,136,0.05)]",
          // Hover 状态
          "hover:shadow-[0_6px_16px_rgba(13,148,136,0.15),0_12px_32px_rgba(13,148,136,0.08)]",
          "hover:border-teal-300 hover:-translate-y-0.5",
          // Active 状态 (soft press)
          "active:shadow-[inset_0_2px_8px_rgba(13,148,136,0.1)]",
          "active:translate-y-0",
          // 拖拽状态
          isDragging
            ? "border-teal-400 bg-teal-50/50 scale-[1.02]"
            : "border-teal-200",
          // 上传中状态
          isUploading && "pointer-events-none opacity-75"
        )}
        role="button"
        tabIndex={0}
        aria-label="上传媒体文件"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          aria-hidden="true"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-teal-700 mb-2 font-medium">
                <span>上传中...</span>
                <span>{uploadProgress}%</span>
              </div>
              {/* Claymorphism 进度条 */}
              <div className="h-3 bg-teal-100 rounded-full overflow-hidden border-2 border-teal-200">
                <div
                  className="h-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-teal-100 text-teal-600 border-2 border-teal-200">
              {getFileTypeIcon()}
            </div>
            <p className="text-lg font-semibold text-[var(--color-text)] mb-2">
              {isDragging ? "松开以上传" : "点击或拖拽文件到这里"}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              支持 JPG, PNG, GIF, WebP, SVG, MP4, WebM, MOV, MP3, WAV, OGG
            </p>
            <p className="text-xs text-teal-600 mt-2 font-medium">
              最大 {(maxSize / (1024 * 1024)).toFixed(0)}MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * 媒体预览组件
 */
export interface MediaPreviewProps {
  url: string
  type: "image" | "video" | "audio"
  onRemove?: () => void
  className?: string
}

export function MediaPreview({
  url,
  type,
  onRemove,
  className,
}: MediaPreviewProps) {
  return (
    <div className={cn("relative group", className)}>
      {/* Claymorphism 容器 */}
      <div className="relative rounded-2xl overflow-hidden border-[3px] border-teal-200 shadow-[0_4px_12px_rgba(13,148,136,0.1),0_8px_24px_rgba(13,148,136,0.05)]">
        {type === "image" && (
          <img
            src={url}
            alt="上传的图片"
            className="w-full h-auto"
            loading="lazy"
          />
        )}
        {type === "video" && (
          <video
            src={url}
            controls
            className="w-full h-auto"
            preload="metadata"
          >
            您的浏览器不支持视频播放
          </video>
        )}
        {type === "audio" && (
          <div className="p-6 bg-gradient-to-br from-teal-50 to-teal-100">
            <audio src={url} controls className="w-full">
              您的浏览器不支持音频播放
            </audio>
          </div>
        )}
      </div>

      {/* 删除按钮 - Claymorphism 风格 */}
      {onRemove && (
        <button
          onClick={onRemove}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-xl",
            "bg-white/95 border-2 border-red-200 text-red-600",
            "shadow-[0_2px_8px_rgba(239,68,68,0.2)]",
            "hover:bg-red-50 hover:border-red-300 hover:shadow-[0_4px_12px_rgba(239,68,68,0.3)]",
            "active:shadow-[inset_0_2px_4px_rgba(239,68,68,0.2)]",
            "transition-all duration-200 ease-out",
            "opacity-0 group-hover:opacity-100",
            "cursor-pointer"
          )}
          aria-label="删除媒体"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
