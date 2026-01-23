/**
 * 题目答题项组件
 * 渲染单个题目的答题界面和结果显示
 */

"use client"

import * as React from "react"
import { Check, X, Lightbulb, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnswerInput } from "./answer-input"

export interface ParsedQuestion {
  index: number
  type: 'choice' | 'multiple-choice' | 'true-false' | 'fill' | 'short' | 'essay' | 'code' | 'matching' | 'ordering'
  question: string
  options?: string[]
  correctAnswer: string
  explanation?: string
}

export interface QuestionResult {
  isCorrect: boolean
  userAnswer: string
  correctAnswer: string
  score: number
  feedback?: string
}

interface QuestionAnswerItemProps {
  question: ParsedQuestion
  mode: 'answer' | 'result'
  userAnswer?: string
  result?: QuestionResult
  onAnswerChange: (answer: string) => void
  onGenerateSimilar: () => void
  isGenerating: boolean
}

export function QuestionAnswerItem({
  question,
  mode,
  userAnswer = '',
  result,
  onAnswerChange,
  onGenerateSimilar,
  isGenerating,
}: QuestionAnswerItemProps) {
  // 检查是否已作答：移除 HTML 标签后检查是否有实际内容
  const isAnswered = React.useMemo(() => {
    if (!userAnswer) return false
    // 移除 HTML 标签和空白字符，检查是否有实际内容
    const textContent = userAnswer.replace(/<[^>]*>/g, '').trim()
    return textContent !== ''
  }, [userAnswer])
  
  const showResult = mode === 'result' && result

  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 space-y-4">
      {/* 题目头部 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              第 {question.index} 题
            </h3>
            {showResult && (
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                  result.isCorrect
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {result.isCorrect ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    正确
                  </>
                ) : (
                  <>
                    <X className="w-3.5 h-3.5" />
                    错误
                  </>
                )}
              </span>
            )}
          </div>
          {/* 题目内容 - 根据是否包含代码块决定显示方式 */}
          {question.question.includes('//') || question.question.includes('#') || question.question.includes('```') ? (
            // 包含代码注释或代码块标记，使用 pre 标签
            <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto">
              {question.question}
            </pre>
          ) : (
            // 普通文本，使用正常字体
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {question.question}
            </div>
          )}
        </div>
      </div>

      {/* 答题输入区域 */}
      {mode === 'answer' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            你的答案：
          </label>
          <AnswerInput
            type={question.type}
            options={question.options}
            value={userAnswer}
            onChange={onAnswerChange}
          />
          {isAnswered && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              已作答
            </p>
          )}
        </div>
      )}

      {/* 结果显示 */}
      {showResult && (
        <div className="space-y-4 pt-4 border-t-2 border-gray-100">
          {/* 用户答案 */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">你的答案：</p>
            <div
              className={cn(
                "p-3 rounded-lg text-sm",
                result.isCorrect ? "bg-green-50 text-green-900" : "bg-red-50 text-red-900"
              )}
            >
              {result.userAnswer || <span className="text-gray-400">未作答</span>}
            </div>
          </div>

          {/* 正确答案 */}
          {!result.isCorrect && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">正确答案：</p>
              <div className="p-3 rounded-lg bg-green-50 text-green-900 text-sm">
                {result.correctAnswer}
              </div>
            </div>
          )}

          {/* 解析 */}
          {question.explanation && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">解析：</p>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-900 text-sm leading-relaxed">
                {question.explanation}
              </div>
            </div>
          )}

          {/* AI 反馈（主观题） */}
          {result.feedback && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">AI 评语：</p>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-900 text-sm leading-relaxed">
                {result.feedback}
              </div>
            </div>
          )}

          {/* 得分 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">得分：</span>
            <span className="text-lg font-bold text-teal-600">{result.score}</span>
            <span className="text-sm text-gray-500">/ 100</span>
          </div>
        </div>
      )}

      {/* 举一反三按钮（仅结果模式显示） */}
      {showResult && (
        <div className="pt-4 border-t-2 border-gray-100">
          <button
            type="button"
            onClick={onGenerateSimilar}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "bg-purple-100 text-purple-700 hover:bg-purple-200",
              "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                举一反三
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
