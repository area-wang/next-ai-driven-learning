/**
 * 大纲预览对话框组件
 * 用于预览AI生成的学习大纲，支持使用或重新生成
 */

"use client"

import * as React from "react"
import { X, Check, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface OutlineItem {
  id?: string
  title: string
  description: string
  estimatedTime?: number | string
  children?: OutlineItem[]
}

interface OutlinePreviewDialogProps {
  isOpen: boolean
  onClose: () => void
  onAccept: (mode: 'replace' | 'merge') => void // 修改：添加模式参数
  onRegenerate: (feedback: string) => Promise<void>
  outlines: OutlineItem[]
  isRegenerating?: boolean
  parentDocTitle?: string // 新增：父文档标题（用于显示上下文）
  hasExistingChildren?: boolean // 新增：是否已有子文档
}

function OutlineTreeView({ items, level = 0 }: { items: OutlineItem[]; level?: number }) {
  return (
    <div className={cn("space-y-2", level > 0 && "ml-6 mt-2")}>
      {items.map((item, index) => (
        <div key={index} className="border-l-2 border-teal-200 pl-3 py-2">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
              {item.estimatedTime && (
                <p className="text-xs text-gray-500 mt-1">
                  预计学习时间：{item.estimatedTime} 分钟
                </p>
              )}
            </div>
          </div>
          {item.children && item.children.length > 0 && (
            <OutlineTreeView items={item.children} level={level + 1} />
          )}
        </div>
      ))}
    </div>
  )
}

export function OutlinePreviewDialog({
  isOpen,
  onClose,
  onAccept,
  onRegenerate,
  outlines,
  isRegenerating = false,
  parentDocTitle,
  hasExistingChildren = false,
}: OutlinePreviewDialogProps) {
  const [feedback, setFeedback] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [mergeMode, setMergeMode] = React.useState<'replace' | 'merge'>('merge') // 新增：默认智能去重

  const handleRegenerate = async () => {
    if (!feedback.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onRegenerate(feedback)
      setFeedback("") // 清空反馈
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-lg">
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              预览生成的学习大纲
            </h2>
            {parentDocTitle && (
              <p className="text-sm text-gray-600 mt-1">
                父文档：{parentDocTitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isRegenerating}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 大纲预览 - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isRegenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
              <p className="text-gray-600">正在重新生成大纲...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  共 {outlines.length} 个章节
                </p>
              </div>
              <OutlineTreeView items={outlines} />
            </>
          )}
        </div>

        {/* 反馈区域 */}
        {!isRegenerating && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 space-y-4">
            {/* 合并模式选择 - 只在有已有子文档时显示 */}
            {hasExistingChildren && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  应用方式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMergeMode('merge')}
                    className={cn(
                      "px-4 py-3 rounded-lg border-2 text-left transition-all cursor-pointer",
                      mergeMode === 'merge'
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="font-medium text-sm text-gray-900">智能去重</div>
                    <div className="text-xs text-gray-600 mt-1">
                      保留不重复的子文档，追加新内容
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeMode('replace')}
                    className={cn(
                      "px-4 py-3 rounded-lg border-2 text-left transition-all cursor-pointer",
                      mergeMode === 'replace'
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="font-medium text-sm text-gray-900">覆盖替换</div>
                    <div className="text-xs text-gray-600 mt-1">
                      删除所有已有子文档，使用新大纲
                    </div>
                  </button>
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                对大纲有什么建议？（可选）
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="例如：需要增加实战案例章节，减少理论部分..."
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        {!isRegenerating && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-sm"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1 px-4 py-2 rounded-lg border border-teal-500 text-teal-600 font-medium hover:bg-teal-50 transition-colors disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  重新生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  重新生成
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => onAccept(mergeMode)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              使用此大纲
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
