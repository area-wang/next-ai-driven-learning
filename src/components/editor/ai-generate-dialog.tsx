/**
 * AI 生成对话框组件
 * 用于在编辑器中触发 AI 生成学习内容
 * 使用 Claymorphism 设计风格
 */

"use client"

import * as React from "react"
import { X, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
      alert("请输入学习主题")
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
      })
      
      // 重置表单
      setTopic("")
      setGoal("")
      setAdditionalContext("")
      setLevel('beginner')
      onClose()
    } catch (error) {
      console.error('Generation failed:', error)
      alert(error instanceof Error ? error.message : 'AI 生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-3xl shadow-[8px_8px_20px_rgba(0,0,0,0.15),-4px_-4px_12px_rgba(255,255,255,0.9)] w-full max-w-2xl max-h-[90vh] flex flex-col border-4 border-white/50">
        {/* 头部 */}
        <div className="flex-shrink-0 px-8 py-6 bg-white/40 backdrop-blur-md border-b-4 border-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                {currentDoc ? 'AI 生成章节内容' : 'AI 生成学习大纲'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="p-2.5 rounded-xl hover:bg-white/60 transition-all disabled:opacity-50 shadow-[2px_2px_4px_rgba(0,0,0,0.1)] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)] cursor-pointer"
              aria-label="关闭"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* 表单 - 可滚动区域 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-6">
          {/* 学习主题 */}
          <div>
            <label htmlFor="topic" className="block text-sm font-bold text-slate-700 mb-3">
              {currentDoc ? '章节标题' : '学习主题'} <span className="text-orange-500">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={currentDoc ? "自动填充当前章节标题" : "例如：React Hooks 进阶"}
              disabled={isGenerating || !!currentDoc}
              className={cn(
                "w-full px-5 py-4 rounded-2xl border-4 border-white/50",
                "bg-white/90 backdrop-blur-sm",
                "text-slate-800 placeholder:text-slate-400 font-medium",
                "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]",
                "focus:outline-none focus:border-teal-400 focus:shadow-[inset_2px_2px_6px_rgba(13,148,136,0.1),0_0_0_3px_rgba(13,148,136,0.1)]",
                "disabled:bg-slate-100/80 disabled:text-slate-600",
                "transition-all duration-200"
              )}
              required
            />
          </div>

          {/* 学习目标 */}
          <div>
            <label htmlFor="goal" className="block text-sm font-bold text-slate-700 mb-3">
              学习目标（可选）
            </label>
            <textarea
              id="goal"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="例如：掌握 useState、useEffect、useContext 等常用 Hooks"
              disabled={isGenerating}
              rows={3}
              className={cn(
                "w-full px-5 py-4 rounded-2xl border-4 border-white/50",
                "bg-white/90 backdrop-blur-sm",
                "text-slate-800 placeholder:text-slate-400 font-medium",
                "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]",
                "focus:outline-none focus:border-teal-400 focus:shadow-[inset_2px_2px_6px_rgba(13,148,136,0.1),0_0_0_3px_rgba(13,148,136,0.1)]",
                "disabled:bg-slate-100/80 disabled:text-slate-600",
                "transition-all duration-200 resize-none"
              )}
            />
          </div>

          {/* 补充描述 - 仅在生成章节内容时显示 */}
          {currentDoc && (
            <div>
              <label htmlFor="additionalContext" className="block text-sm font-bold text-slate-700 mb-3">
                补充描述（可选）
              </label>
              <textarea
                id="additionalContext"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="例如：重点讲解实际应用场景，包含完整代码示例"
                disabled={isGenerating}
                rows={3}
                className={cn(
                  "w-full px-5 py-4 rounded-2xl border-4 border-white/50",
                  "bg-white/90 backdrop-blur-sm",
                  "text-slate-800 placeholder:text-slate-400 font-medium",
                  "shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05),2px_2px_6px_rgba(255,255,255,0.8)]",
                  "focus:outline-none focus:border-teal-400 focus:shadow-[inset_2px_2px_6px_rgba(13,148,136,0.1),0_0_0_3px_rgba(13,148,136,0.1)]",
                  "disabled:bg-slate-100/80 disabled:text-slate-600",
                  "transition-all duration-200 resize-none"
                )}
              />
            </div>
          )}

          {/* 难度级别 */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">
              难度级别
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'beginner', label: '初级', color: 'from-green-400 to-emerald-500', activeColor: 'from-green-500 to-emerald-600' },
                { value: 'intermediate', label: '中级', color: 'from-blue-400 to-cyan-500', activeColor: 'from-blue-500 to-cyan-600' },
                { value: 'advanced', label: '高级', color: 'from-purple-400 to-pink-500', activeColor: 'from-purple-500 to-pink-600' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLevel(option.value as any)}
                  disabled={isGenerating}
                  className={cn(
                    "px-4 py-4 rounded-2xl border-4 font-bold transition-all duration-200 cursor-pointer",
                    "shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]",
                    "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    level === option.value
                      ? `bg-gradient-to-br ${option.activeColor} border-white/50 text-white scale-[1.05] shadow-[6px_6px_12px_rgba(0,0,0,0.15),-3px_-3px_8px_rgba(255,255,255,0.9)]`
                      : "bg-white/90 border-white/50 text-slate-700 hover:scale-[1.02] hover:bg-white"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 提示信息 */}
          {currentDoc ? (
            <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-white/50 shadow-[inset_2px_2px_4px_rgba(34,197,94,0.1)]">
              <p className="text-sm font-bold text-green-800">
                ✨ 将为当前章节「{currentDoc.title}」生成详细学习内容
              </p>
            </div>
          ) : parentDocId ? (
            <div className="px-5 py-4 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 border-4 border-white/50 shadow-[inset_2px_2px_4px_rgba(59,130,246,0.1)]">
              <p className="text-sm font-bold text-blue-800">
                💡 将在当前文档下生成子文档
              </p>
            </div>
          ) : null}
          </div>
        </form>

        {/* 底部按钮 - 固定在底部 */}
        <div className="flex-shrink-0 px-8 py-6 bg-white/40 backdrop-blur-md border-t-4 border-white/50">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className={cn(
                "flex-1 px-6 py-4 rounded-2xl border-4 border-white/50",
                "bg-white/80 text-slate-700 font-bold",
                "shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]",
                "hover:scale-[1.02] active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                "transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              )}
            >
              取消
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isGenerating || !topic.trim()}
              className={cn(
                "flex-1 px-6 py-4 rounded-2xl border-4 border-white/50",
                "bg-gradient-to-br from-teal-500 to-cyan-500",
                "text-white font-bold",
                "shadow-[4px_4px_8px_rgba(0,0,0,0.1),-2px_-2px_6px_rgba(255,255,255,0.8)]",
                "hover:scale-[1.02] hover:from-teal-600 hover:to-cyan-600",
                "active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200",
                "flex items-center justify-center gap-2 cursor-pointer"
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  开始生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
