/**
 * 可调整大小的媒体扩展
 * 支持图片和视频的尺寸调整、对齐设置和删除
 */

"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { NodeViewProps } from "@tiptap/core"
import * as React from "react"
import { AlignLeft, AlignCenter, AlignRight, Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

// 可调整大小的图片组件
function ResizableImageView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = React.useState(false)
  const [showControls, setShowControls] = React.useState(false)
  const imageRef = React.useRef<HTMLImageElement>(null)
  const startX = React.useRef(0)
  const startWidth = React.useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startX.current = e.clientX
    startWidth.current = node.attrs.width || imageRef.current?.offsetWidth || 300
  }

  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current
      const newWidth = Math.max(100, Math.min(1000, startWidth.current + diff))
      updateAttributes({ width: newWidth })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, updateAttributes])

  const alignment = node.attrs.align || "left"

  return (
    <NodeViewWrapper
      className={cn(
        "relative my-4 group",
        alignment === "center" && "mx-auto",
        alignment === "right" && "ml-auto",
        alignment === "left" && "mr-auto"
      )}
      style={{
        width: node.attrs.width ? `${node.attrs.width}px` : "auto",
        maxWidth: "100%",
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isResizing && setShowControls(false)}
    >
      {/* 控制工具栏 */}
      {(showControls || selected) && (
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-lg z-10 w-fit mx-auto">
          <button
            type="button"
            onClick={() => updateAttributes({ align: "left" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "left"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updateAttributes({ align: "center" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "center"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="居中对齐"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updateAttributes({ align: "right" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "right"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={deleteNode}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-red-100 text-red-600"
            )}
            title="删除图片"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 图片 */}
      <img
        ref={imageRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        className={cn(
          "rounded-lg max-w-full h-auto",
          selected && "ring-2 ring-[var(--color-primary)]"
        )}
        style={{ width: "100%" }}
      />

      {/* 调整大小手柄 */}
      {(showControls || selected) && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-12 bg-[var(--color-primary)] rounded-full cursor-ew-resize flex items-center justify-center shadow-lg"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
    </NodeViewWrapper>
  )
}

// 可调整大小的视频组件
function ResizableVideoView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = React.useState(false)
  const [showControls, setShowControls] = React.useState(false)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const startX = React.useRef(0)
  const startWidth = React.useRef(0)

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startX.current = e.clientX
    startWidth.current = node.attrs.width || videoRef.current?.offsetWidth || 640
  }

  React.useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - startX.current
      const newWidth = Math.max(200, Math.min(1200, startWidth.current + diff))
      updateAttributes({ width: newWidth })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, updateAttributes])

  const alignment = node.attrs.align || "left"

  return (
    <NodeViewWrapper
      className={cn(
        "relative my-4 group",
        alignment === "center" && "mx-auto",
        alignment === "right" && "ml-auto",
        alignment === "left" && "mr-auto"
      )}
      style={{
        width: node.attrs.width ? `${node.attrs.width}px` : "auto",
        maxWidth: "100%",
      }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isResizing && setShowControls(false)}
    >
      {/* 控制工具栏 */}
      {(showControls || selected) && (
        <div className="absolute -top-12 left-0 right-0 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border-[3px] border-[var(--color-primary)]/20 bg-white/95 backdrop-blur-md shadow-lg z-10 w-fit mx-auto">
          <button
            type="button"
            onClick={() => updateAttributes({ align: "left" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "left"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updateAttributes({ align: "center" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "center"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="居中对齐"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => updateAttributes({ align: "right" })}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-[var(--color-secondary)]/20",
              alignment === "right"
                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                : "text-[var(--color-text)]"
            )}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          <button
            type="button"
            onClick={deleteNode}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200 cursor-pointer",
              "hover:bg-red-100 text-red-600"
            )}
            title="删除视频"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 视频 */}
      <video
        ref={videoRef}
        src={node.attrs.src}
        controls
        className={cn(
          "rounded-lg max-w-full h-auto",
          selected && "ring-2 ring-[var(--color-primary)]"
        )}
        style={{ width: "100%" }}
      />

      {/* 调整大小手柄 */}
      {(showControls || selected) && (
        <div
          className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-12 bg-[var(--color-primary)] rounded-full cursor-ew-resize flex items-center justify-center shadow-lg"
          onMouseDown={handleMouseDown}
        >
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
    </NodeViewWrapper>
  )
}

// 可调整大小的图片扩展
export const ResizableImage = Node.create({
  name: "resizableImage",

  group: "block",

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      width: {
        default: null,
      },
      align: {
        default: "left",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-type="resizable-image"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { "data-type": "resizable-image" })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

// 可调整大小的视频扩展
export const ResizableVideo = Node.create({
  name: "resizableVideo",

  group: "block",

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: null,
      },
      align: {
        default: "left",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video[data-type="resizable-video"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", mergeAttributes(HTMLAttributes, { "data-type": "resizable-video", controls: "" })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableVideoView)
  },
})
