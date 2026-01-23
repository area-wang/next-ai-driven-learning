/**
 * 题目举一反三按钮组件
 * 在编辑器中为每个题目添加生成相似题目的按钮
 */

"use client"

import * as React from "react"
import { Lightbulb, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuestionSimilarButtonProps {
  questionIndex: number
  questionText: string
  questionType: 'choice' | 'fill' | 'short' | 'code'
  onGenerate: (questionIndex: number, questionText: string, questionType: string) => Promise<void>
}

export function QuestionSimilarButton({
  questionIndex,
  questionText,
  questionType,
  onGenerate,
}: QuestionSimilarButtonProps) {
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleClick = async () => {
    setIsGenerating(true)
    try {
      await onGenerate(questionIndex, questionText, questionType)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isGenerating}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        "bg-purple-100 text-purple-700 hover:bg-purple-200",
        "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        "ml-2"
      )}
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          生成中...
        </>
      ) : (
        <>
          <Lightbulb className="w-3.5 h-3.5" />
          举一反三
        </>
      )}
    </button>
  )
}
