'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast-container'
import { Spinner } from '@/components/ui/spinner'

interface FeynmanEditorProps {
  contentId: string
  initialConcept?: string
  initialExplanation?: string
  onSave?: (data: any) => void
}

export function FeynmanEditor({
  contentId,
  initialConcept = '',
  initialExplanation = '',
  onSave,
}: FeynmanEditorProps) {
  const [concept, setConcept] = useState(initialConcept)
  const [explanation, setExplanation] = useState(initialExplanation)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    gaps: string[]
    suggestions: string[]
    score: number
  } | null>(null)
  const toast = useToast()

  useEffect(() => {
    setConcept(initialConcept)
    setExplanation(initialExplanation)
  }, [initialConcept, initialExplanation])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!concept.trim() || !explanation.trim()) {
      toast.warning('请填写概念和解释')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feynman/explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          concept: concept.trim(),
          explanation: explanation.trim(),
        }),
      })

      const result = await response.json() as {
        success: boolean
        data?: any
        error?: string
      }

      if (result.success && result.data) {
        toast.success('费曼解释已保存')
        setFeedback(result.data.aiFeedback)
        onSave?.(result.data)
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存费曼解释失败:', error)
      toast.error('保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = () => {
    setConcept('')
    setExplanation('')
    setFeedback(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧：编辑器 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-teal-600">
          费曼学习法
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          用简单的语言解释概念，就像在教一个完全不懂的人。这能帮助你发现知识盲点。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              要解释的概念
            </label>
            <Input
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="例如：什么是递归？"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              你的解释
            </label>
            <Textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="用最简单的语言解释这个概念，就像在教一个小学生..."
              rows={12}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-2">
              提示：尝试使用类比、举例子、避免专业术语
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isSubmitting}
            >
              清空
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  获取反馈中...
                </>
              ) : (
                '获取 AI 反馈'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* 右侧：反馈面板 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-teal-600">
          AI 反馈
        </h3>

        {!feedback ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-center">
              提交你的解释后，AI 会帮你识别知识盲点并提供改进建议
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 评分 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">解释质量</span>
                <span className="text-2xl font-bold text-teal-600">
                  {feedback.score}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all"
                  style={{ width: `${feedback.score}%` }}
                />
              </div>
            </div>

            {/* 知识盲点 */}
            {feedback.gaps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-red-600">
                  🔍 知识盲点
                </h4>
                <ul className="space-y-2">
                  {feedback.gaps.map((gap, index) => (
                    <li
                      key={index}
                      className="text-sm bg-red-50 p-3 rounded border-l-4 border-red-400"
                    >
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 改进建议 */}
            {feedback.suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 text-blue-600">
                  💡 改进建议
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 鼓励信息 */}
            {feedback.score >= 80 && (
              <div className="bg-green-50 p-4 rounded border-l-4 border-green-400">
                <p className="text-sm text-green-800">
                  🎉 太棒了！你的解释非常清晰。继续保持这种简单易懂的风格！
                </p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
