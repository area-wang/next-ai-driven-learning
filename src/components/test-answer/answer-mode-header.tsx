/**
 * 答题模式头部组件
 * 显示进度、开始/退出按钮、提交按钮
 */

"use client"

import { Check, X, Loader2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnswerModeHeaderProps {
  mode: 'answer' | 'result'
  totalQuestions: number
  correctCount?: number
  isSubmitting: boolean
  onExitAnswer: () => void
  onSubmit: () => void
  onRetry: () => void
}

export function AnswerModeHeader({
  mode,
  totalQuestions,
  correctCount,
  isSubmitting,
  onExitAnswer,
  onSubmit,
  onRetry,
}: AnswerModeHeaderProps) {
  // 答题模式：只显示标题和提交按钮
  if (mode === 'answer') {
    return (
      <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          {/* 标题 */}
          <h2 className="text-base font-semibold">答题中</h2>
          
          <div className="flex items-center gap-3">
            {/* 提交按钮 */}
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={cn(
                "px-4 py-1.5 rounded-lg font-medium transition-all cursor-pointer shadow-md",
                "bg-white text-teal-600 hover:bg-gray-50",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  评估中...
                </span>
              ) : (
                "提交答案"
              )}
            </button>
            
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={onExitAnswer}
              disabled={isSubmitting}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="退出答题"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 结果模式：显示得分和统计
  if (mode === 'result') {
    const score = correctCount !== undefined ? Math.round((correctCount / totalQuestions) * 100) : 0
    const isPassed = score >= 60
    
    return (
      <div className={cn(
        "sticky top-0 z-10 px-4 py-4 shadow-lg",
        isPassed
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
          : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
      )}>
        <div className="space-y-4">
          {/* 标题和关闭按钮 */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">答题结果</h2>
            <button
              type="button"
              onClick={onExitAnswer}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              aria-label="关闭"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* 得分显示 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs opacity-90">总分</p>
              <p className="text-3xl font-bold">{score}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-90">正确率</p>
              <p className="text-2xl font-semibold">
                {correctCount} / {totalQuestions}
              </p>
            </div>
          </div>

          {/* 通过状态 */}
          <div className="flex items-center justify-center gap-2 py-2 bg-white/20 rounded-lg">
            {isPassed ? (
              <>
                <Check className="w-5 h-5" />
                <span className="text-base font-medium">通过测试</span>
              </>
            ) : (
              <>
                <X className="w-5 h-5" />
                <span className="text-base font-medium">未通过测试</span>
              </>
            )}
          </div>
          
          {/* 重新答题按钮 */}
          <button
            type="button"
            onClick={onRetry}
            className="w-full px-4 py-2.5 bg-white text-teal-600 hover:bg-gray-50 rounded-lg font-medium transition-colors cursor-pointer shadow-lg"
          >
            重新答题
          </button>
        </div>
      </div>
    )
  }

  return null
}
