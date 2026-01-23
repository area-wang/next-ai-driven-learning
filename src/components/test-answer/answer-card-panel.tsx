/**
 * 答题卡面板组件
 * 显示所有题目的答题状态，支持快速跳转
 */

"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check, Circle, X } from "lucide-react"

interface AnswerCardPanelProps {
  totalQuestions: number
  answeredQuestions: Set<number>
  currentQuestionIndex: number
  results?: Record<number, { isCorrect: boolean }>
  mode: 'answer' | 'result'
  onQuestionClick: (index: number) => void
  answeredCount: number
  elapsedTime: number
}

export function AnswerCardPanel({
  totalQuestions,
  answeredQuestions,
  currentQuestionIndex,
  results,
  mode,
  onQuestionClick,
  answeredCount,
  elapsedTime,
}: AnswerCardPanelProps) {
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-64 flex-shrink-0 bg-white border-l-2 border-gray-200 p-6 overflow-y-auto">
      {/* 标题 */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">答题卡</h3>

      {/* 进度信息 - 答题模式 */}
      {mode === 'answer' && (
        <div className="mb-6 space-y-3">
          {/* 答题进度 */}
          <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">答题进度</p>
                <p className="text-2xl font-bold text-teal-600">
                  {answeredCount} / {totalQuestions}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 mb-1">完成度</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((answeredCount / totalQuestions) * 100)}%
                </p>
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* 用时 */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">用时</span>
            <span className="text-lg font-bold text-gray-900">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      )}

      {/* 统计信息 - 结果模式 */}
      {mode === 'result' && (
        <div className="mb-6 p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">已答题数</span>
            <span className="text-lg font-bold text-teal-600">
              {answeredCount}/{totalQuestions}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">用时</span>
            <span className="text-lg font-bold text-gray-900">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      )}

      {/* 题号网格 */}
      <div className="mb-6">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((questionNum) => {
            const isAnswered = answeredQuestions.has(questionNum)
            const isCurrent = questionNum === currentQuestionIndex
            const result = results?.[questionNum]

            return (
              <button
                key={questionNum}
                type="button"
                onClick={() => onQuestionClick(questionNum)}
                className={cn(
                  "relative w-full aspect-square rounded-lg text-sm font-medium transition-all cursor-pointer",
                  "flex items-center justify-center",
                  // 当前题目
                  isCurrent && "ring-2 ring-teal-500 ring-offset-2",
                  // 答题模式
                  mode === 'answer' && !isAnswered && "bg-gray-100 text-gray-400 hover:bg-gray-200",
                  mode === 'answer' && isAnswered && "bg-teal-100 text-teal-700 hover:bg-teal-200",
                  // 结果模式
                  mode === 'result' && result?.isCorrect && "bg-green-100 text-green-700",
                  mode === 'result' && result && !result.isCorrect && "bg-red-100 text-red-700",
                  mode === 'result' && !result && "bg-gray-100 text-gray-400"
                )}
              >
                {/* 题号 */}
                <span className="relative z-10">{questionNum}</span>

                {/* 状态图标 */}
                {mode === 'answer' && isAnswered && (
                  <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-teal-600" />
                )}
                {mode === 'result' && result?.isCorrect && (
                  <Check className="absolute top-0.5 right-0.5 w-3 h-3 text-green-600" />
                )}
                {mode === 'result' && result && !result.isCorrect && (
                  <X className="absolute top-0.5 right-0.5 w-3 h-3 text-red-600" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 图例 */}
      <div className="space-y-2 text-xs text-gray-600">
        {mode === 'answer' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300" />
              <span>未作答</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-teal-100 border border-teal-300 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-teal-600" />
              </div>
              <span>已作答</span>
            </div>
          </>
        )}
        {mode === 'result' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-300 flex items-center justify-center">
                <Check className="w-2.5 h-2.5 text-green-600" />
              </div>
              <span>正确</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-300 flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-red-600" />
              </div>
              <span>错误</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
