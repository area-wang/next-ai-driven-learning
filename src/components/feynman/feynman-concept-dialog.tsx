'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toast-container'
import { Loader2, Brain, CheckCircle2 } from 'lucide-react'

interface Concept {
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
}

interface FeynmanConceptDialogProps {
  isOpen: boolean
  onClose: () => void
  concepts: Concept[]
  contentId: string
  onSuccess?: () => void
}

export function FeynmanConceptDialog({
  isOpen,
  onClose,
  concepts,
  contentId,
  onSuccess,
}: FeynmanConceptDialogProps) {
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null)
  const [explanation, setExplanation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{
    gaps: string[]
    suggestions: string[]
    score: number
  } | null>(null)
  const toast = useToast()

  const handleConceptSelect = (concept: Concept) => {
    setSelectedConcept(concept)
    setExplanation('')
    setFeedback(null)
  }

  const handleSubmit = async () => {
    if (!selectedConcept || !explanation.trim()) {
      toast.warning('请输入您的解释')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feynman/explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          concept: selectedConcept.name,
          explanation: explanation.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('保存失败')
      }

      const result = await response.json() as {
        success: boolean
        data?: {
          aiFeedback: {
            gaps: string[]
            suggestions: string[]
            score: number
          }
        }
        error?: string
      }

      if (result.success && result.data) {
        setFeedback(result.data.aiFeedback)
        toast.success('费曼解释已保存，AI 反馈已生成')
        onSuccess?.()
      } else {
        toast.error(result.error || '保存失败')
      }
    } catch (error) {
      console.error('保存费曼解释失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedConcept(null)
    setExplanation('')
    setFeedback(null)
    onClose()
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单'
      case 'medium':
        return '中等'
      case 'hard':
        return '困难'
      default:
        return difficulty
    }
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleClose} side="right">
      <DrawerContent>
        <DrawerHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-teal-600" />
            费曼学习法 - 用自己的话解释
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            选择一个概念，用最简单的语言解释它，就像在教一个完全不懂的人
          </p>
        </DrawerHeader>

        <DrawerBody className="p-6">
            {!selectedConcept ? (
              /* 概念列表 */
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  AI 从文档中提取了以下核心概念，请选择一个进行解释：
                </h3>
                {concepts.map((concept, index) => (
                  <button
                    key={index}
                    onClick={() => handleConceptSelect(concept)}
                    className="w-full text-left p-4 border-2 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {concept.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {concept.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded border ${getDifficultyColor(
                          concept.difficulty
                        )}`}
                      >
                        {getDifficultyLabel(concept.difficulty)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              /* 解释输入和反馈 */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：输入区域 */}
                <div>
                  <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-200">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {selectedConcept.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {selectedConcept.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      用您自己的话解释这个概念
                    </label>
                    <Textarea
                      value={explanation}
                      onChange={(e) => setExplanation(e.target.value)}
                      placeholder="用最简单的语言解释这个概念，就像在教一个小学生...&#10;&#10;提示：&#10;• 避免使用专业术语&#10;• 使用类比和例子&#10;• 说明为什么这个概念重要"
                      rows={12}
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedConcept(null)
                        setExplanation('')
                        setFeedback(null)
                      }}
                      disabled={isSubmitting}
                    >
                      返回选择
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !explanation.trim()}
                      className="flex-1"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          获取 AI 反馈中...
                        </>
                      ) : (
                        '提交并获取 AI 反馈'
                      )}
                    </Button>
                  </div>
                </div>

                {/* 右侧：AI 反馈 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-4 text-gray-900">
                    AI 反馈
                  </h3>

                  {!feedback ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                      <Brain className="w-16 h-16 mb-4" />
                      <p className="text-center text-sm">
                        提交您的解释后，AI 会评估您的理解并提供反馈
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 评分 */}
                      <div className="bg-white rounded-lg p-4 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">理解程度</span>
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
                        <div className="bg-white rounded-lg p-4 border">
                          <h4 className="text-sm font-semibold mb-2 text-red-600">
                            🔍 需要改进的地方
                          </h4>
                          <ul className="space-y-2">
                            {feedback.gaps.map((gap, index) => (
                              <li
                                key={index}
                                className="text-sm bg-red-50 p-2 rounded border-l-2 border-red-400"
                              >
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 改进建议 */}
                      {feedback.suggestions.length > 0 && (
                        <div className="bg-white rounded-lg p-4 border">
                          <h4 className="text-sm font-semibold mb-2 text-blue-600">
                            💡 改进建议
                          </h4>
                          <ul className="space-y-2">
                            {feedback.suggestions.map((suggestion, index) => (
                              <li
                                key={index}
                                className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-400"
                              >
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 鼓励信息 */}
                      {feedback.score >= 80 && (
                        <div className="bg-green-50 p-4 rounded border-l-4 border-green-400 flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-green-800">
                            太棒了！您的解释非常清晰易懂。继续保持这种简单的风格！
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
        </DrawerBody>

        <DrawerFooter>
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
