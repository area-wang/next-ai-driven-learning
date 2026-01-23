/**
 * AI 生成对话框组件
 * 用于在编辑器中触发 AI 生成学习内容
 * 使用 Claymorphism 设计风格
 */

"use client"

import * as React from "react"
import { X, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { useToast } from "@/components/ui/toast-container"

interface AIGenerateDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (params: GenerateParams) => Promise<void>
  parentDocId?: string
  // 新增：当前文档信息（用于生成章节内容）
  currentDoc?: {
    id: string
    title: string
    description?: string
  }
  // 新增：学习计划信息
  planInfo?: {
    topic: string
    goal?: string
    level: 'beginner' | 'intermediate' | 'advanced'
  }
}

export interface GenerateParams {
  topic: string
  goal?: string
  level: 'beginner' | 'intermediate' | 'advanced'
  parentDocId?: string
  // 新增：用于章节内容生成
  additionalContext?: string
  currentDocId?: string
  modelId?: string // 添加模型ID参数
}

export function AIGenerateDialog({
  isOpen,
  onClose,
  onGenerate,
  parentDocId,
  currentDoc,
  planInfo,
}: AIGenerateDialogProps) {
  const [topic, setTopic] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [additionalContext, setAdditionalContext] = React.useState("")
  const [level, setLevel] = React.useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string | undefined>(undefined)
  const toast = useToast()

  // 当对话框打开时，自动填充信息
  React.useEffect(() => {
    if (isOpen) {
      if (currentDoc) {
        // 生成章节内容模式：使用当前文档标题
        setTopic(currentDoc.title)
        setGoal(currentDoc.description || planInfo?.goal || "")
      } else if (planInfo) {
        // 生成大纲模式：使用计划信息
        setTopic(planInfo.topic)
        setGoal(planInfo.goal || "")
        setLevel(planInfo.level)
      }
    }
  }, [isOpen, currentDoc, planInfo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      toast.warning("请输入学习主题")
      return
    }

    setIsGenerating(true)
    try {
      await onGenerate({
        topic: topic.trim(),
        goal: goal.trim() || undefined,
        level,
        parentDocId,
        additionalContext: additionalContext.trim() || undefined,
        currentDocId: currentDoc?.id,
        modelId: selectedModelId, // 传递选中的模型ID
      })
      
      // 重置表单
      setTopic("")
      setGoal("")
      setAdditionalContext("")
      setLevel('beginner')
      onClose()
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : 'AI 生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col shadow-lg">
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentDoc ? 'AI 生成章节内容' : 'AI 生成学习大纲'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单 - 可滚动区域 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* 学习主题 */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                {currentDoc ? '章节标题' : '学习主题'} <span className="text-red-500">*</span>
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={currentDoc ? "自动填充当前章节标题" : "例如：React Hooks 进阶"}
                disabled={isGenerating || !!currentDoc}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                required
              />
            </div>

            {/* 学习目标 */}
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                学习目标（可选）
              </label>
              <textarea
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例如：掌握 useState、useEffect、useContext 等常用 Hooks"
                disabled={isGenerating}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm resize-none"
              />
            </div>

            {/* 补充描述 - 仅在生成章节内容时显示 */}
            {currentDoc && (
              <div>
                <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
                  补充描述（可选）
                </label>
                <textarea
                  id="additionalContext"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="例如：重点讲解实际应用场景，包含完整代码示例"
                  disabled={isGenerating}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm resize-none"
                />
              </div>
            )}

            {/* 难度级别 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                难度级别
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'beginner', label: '初级' },
                  { value: 'intermediate', label: '中级' },
                  { value: 'advanced', label: '高级' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLevel(option.value as any)}
                    disabled={isGenerating}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      level === option.value
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI 模型选择 */}
            <ConfiguredModelSelector
              value={selectedModelId}
              onChange={setSelectedModelId}
              label="AI 模型"
            />

            {/* 提示信息 */}
            {currentDoc ? (
              <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  将为「{currentDoc.title}」生成详细学习内容
                </p>
              </div>
            ) : parentDocId ? (
              <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  将在当前文档下生成子文档
                </p>
              </div>
            ) : null}
          </div>
        </form>

        {/* 底部按钮 - 固定在底部 */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isGenerating || !topic.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                生成
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
