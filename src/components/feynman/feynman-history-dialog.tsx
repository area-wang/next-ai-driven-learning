'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Loader2, Brain, Calendar, TrendingUp } from 'lucide-react'

interface FeynmanExplanation {
  id: string
  concept: string
  explanation: string
  aiFeedback: {
    score: number
    gaps: string[]
    suggestions: string[]
  } | null
  createdAt: string
}

interface FeynmanHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
}

export function FeynmanHistoryDialog({
  isOpen,
  onClose,
  contentId,
}: FeynmanHistoryDialogProps) {
  const [loading, setLoading] = useState(true)
  const [explanations, setExplanations] = useState<FeynmanExplanation[]>([])
  const [selectedExplanation, setSelectedExplanation] = useState<FeynmanExplanation | null>(null)

  useEffect(() => {
    if (isOpen && contentId) {
      loadHistory()
    }
  }, [isOpen, contentId])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/feynman/explanations?contentId=${contentId}`)
      if (!response.ok) {
        throw new Error('加载历史记录失败')
      }

      const result = await response.json() as { success: boolean; data: FeynmanExplanation[] }
      if (result.success) {
        setExplanations(result.data)
        if (result.data.length > 0) {
          setSelectedExplanation(result.data[0])
        }
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  return (
    <Drawer open={isOpen} onOpenChange={onClose} side="right">
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Brain className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">费曼学习法历史记录</h2>
              <p className="text-sm text-gray-600 mt-0.5">查看您之前的解释和 AI 反馈</p>
            </div>
          </div>
        </DrawerHeader>

        <DrawerBody className="flex overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : explanations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                <Brain className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">暂无历史记录</p>
                <p className="text-sm mt-2">开始使用费曼学习法来记录您的理解吧</p>
              </div>
            ) : (
              <>
                {/* 左侧列表 */}
                <div className="w-80 border-r overflow-y-auto">
                  <div className="p-4 space-y-2">
                    {explanations.map((exp) => (
                      <button
                        key={exp.id}
                        onClick={() => setSelectedExplanation(exp)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedExplanation?.id === exp.id
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-medium text-gray-900 text-sm line-clamp-2">
                            {exp.concept}
                          </h3>
                          {exp.aiFeedback && (
                            <span
                              className={`flex-shrink-0 text-lg font-bold ${getScoreColor(
                                exp.aiFeedback.score
                              )}`}
                            >
                              {exp.aiFeedback.score}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(exp.createdAt)}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 右侧详情 */}
                {selectedExplanation && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl mx-auto space-y-6">
                      {/* 概念标题 */}
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          {selectedExplanation.concept}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(selectedExplanation.createdAt)}
                        </p>
                      </div>

                      {/* 您的解释 */}
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-5">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                          <span className="text-lg">💭</span>
                          您的解释
                        </h4>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {selectedExplanation.explanation}
                        </p>
                      </div>

                      {/* AI 反馈 */}
                      {selectedExplanation.aiFeedback && (
                        <div className="space-y-4">
                          {/* 评分 */}
                          <div
                            className={`border-2 rounded-lg p-5 ${getScoreBgColor(
                              selectedExplanation.aiFeedback.score
                            )}`}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5" />
                                理解程度评分
                              </h4>
                              <span
                                className={`text-4xl font-bold ${getScoreColor(
                                  selectedExplanation.aiFeedback.score
                                )}`}
                              >
                                {selectedExplanation.aiFeedback.score}
                              </span>
                            </div>
                          </div>

                          {/* 知识盲点 */}
                          {selectedExplanation.aiFeedback.gaps.length > 0 && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5">
                              <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                知识盲点
                              </h4>
                              <ul className="space-y-2">
                                {selectedExplanation.aiFeedback.gaps.map((gap, index) => (
                                  <li key={index} className="flex items-start gap-2 text-gray-700">
                                    <span className="text-orange-500 mt-1">•</span>
                                    <span>{gap}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 改进建议 */}
                          {selectedExplanation.aiFeedback.suggestions.length > 0 && (
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-5">
                              <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                                <span className="text-lg">💡</span>
                                改进建议
                              </h4>
                              <ul className="space-y-2">
                                {selectedExplanation.aiFeedback.suggestions.map(
                                  (suggestion, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-gray-700"
                                    >
                                      <span className="text-green-500 mt-1">•</span>
                                      <span>{suggestion}</span>
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
        </DrawerBody>

        <DrawerFooter>
          <Button onClick={onClose} variant="outline">
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
