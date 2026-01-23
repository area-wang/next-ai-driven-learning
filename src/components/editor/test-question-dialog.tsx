/**
 * 生成测试题对话框组件
 * 用于生成学习内容相关的测试题
 * 支持随机分配和自定义每个题型的数量
 */

"use client"

import * as React from "react"
import { X, BookOpen, Loader2, Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfiguredModelSelector } from "@/components/ai/configured-model-selector"
import { useToast } from "@/components/ui/toast-container"

interface TestQuestionDialogProps {
  isOpen: boolean
  onClose: () => void
  onGenerate: (params: GenerateTestParams) => Promise<void>
  parentDocId?: string
  currentDoc?: {
    id: string
    title: string
    description?: string
  }
}

export interface GenerateTestParams {
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionCount: number
  questionTypes: string[]
  questionTypeConfig?: Record<string, number> // 每个题型的数量配置
  isRandomDistribution?: boolean // 是否随机分配
  additionalContext?: string
  parentDocId?: string
  currentDocId?: string
  modelId?: string // 添加模型ID参数
}

// 预定义题型
const PREDEFINED_TYPES = [
  { value: 'choice', label: '单选题' },
  { value: 'multiple-choice', label: '多选题' },
  { value: 'true-false', label: '判断题' },
  { value: 'fill', label: '填空题' },
  { value: 'short', label: '简答题' },
  { value: 'essay', label: '论述题' },
  { value: 'code', label: '编程题' },
  { value: 'matching', label: '匹配题' },
  { value: 'ordering', label: '排序题' },
]

export function TestQuestionDialog({
  isOpen,
  onClose,
  onGenerate,
  parentDocId,
  currentDoc,
}: TestQuestionDialogProps) {
  const toast = useToast()
  const [topic, setTopic] = React.useState("")
  const [difficulty, setDifficulty] = React.useState<'easy' | 'medium' | 'hard'>('medium')
  const [questionCount, setQuestionCount] = React.useState(5)
  const [questionTypes, setQuestionTypes] = React.useState<string[]>(['choice', 'multiple-choice', 'true-false'])
  const [questionTypeConfig, setQuestionTypeConfig] = React.useState<Record<string, number>>({})
  const [isRandomDistribution, setIsRandomDistribution] = React.useState(true)
  const [additionalContext, setAdditionalContext] = React.useState("")
  const [customType, setCustomType] = React.useState("")
  const [customTypes, setCustomTypes] = React.useState<string[]>([])
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [selectedModelId, setSelectedModelId] = React.useState<string | undefined>(undefined)

  // 计算总题目数量（自定义模式）
  const totalCustomCount = React.useMemo(() => {
    return Object.values(questionTypeConfig).reduce((sum, count) => sum + count, 0)
  }, [questionTypeConfig])

  // 当对话框打开时，自动填充信息
  React.useEffect(() => {
    if (isOpen) {
      if (currentDoc) {
        let title = currentDoc.title
        if (title.endsWith(' - 测试题')) {
          title = title.replace(/ - 测试题$/, '')
        }
        setTopic(title)
      } else {
        // 重置表单
        setTopic("")
        setDifficulty('medium')
        setQuestionCount(5)
        setQuestionTypes(['choice', 'multiple-choice', 'true-false'])
        setQuestionTypeConfig({})
        setIsRandomDistribution(true)
        setAdditionalContext("")
        setCustomType("")
        setCustomTypes([])
      }
    }
  }, [isOpen, currentDoc])

  // 当切换分配模式时，初始化配置
  React.useEffect(() => {
    if (!isRandomDistribution && questionTypes.length > 0) {
      // 切换到自定义模式时，平均分配题目数量
      const avgCount = Math.floor(questionCount / questionTypes.length)
      const remainder = questionCount % questionTypes.length
      const newConfig: Record<string, number> = {}
      
      questionTypes.forEach((type, index) => {
        newConfig[type] = avgCount + (index < remainder ? 1 : 0)
      })
      
      setQuestionTypeConfig(newConfig)
    }
  }, [isRandomDistribution, questionTypes.length])

  // 当选中的题型变化时，更新配置
  const toggleQuestionType = (type: string) => {
    if (questionTypes.includes(type)) {
      // 取消选中
      setQuestionTypes((prev) => prev.filter((t) => t !== type))
      setQuestionTypeConfig((prev) => {
        const newConfig = { ...prev }
        delete newConfig[type]
        return newConfig
      })
    } else {
      // 选中
      setQuestionTypes((prev) => [...prev, type])
      if (!isRandomDistribution) {
        // 自定义模式下，默认分配1道题
        setQuestionTypeConfig((prev) => ({ ...prev, [type]: 1 }))
      }
    }
  }

  // 更新某个题型的数量
  const updateTypeCount = (type: string, count: number) => {
    if (count < 0) count = 0
    if (count > 50) count = 50
    setQuestionTypeConfig((prev) => ({ ...prev, [type]: count }))
  }

  const addCustomType = () => {
    const trimmed = customType.trim()
    
    if (!trimmed) {
      toast.warning("请输入题型名称")
      return
    }
    
    if (trimmed.length < 2 || trimmed.length > 10) {
      toast.warning("题型名称长度必须在 2-10 个字符之间")
      return
    }
    
    const predefinedLabels = PREDEFINED_TYPES.map(t => t.label)
    if (predefinedLabels.includes(trimmed)) {
      toast.warning("该题型已存在于预定义列表中")
      return
    }
    
    if (customTypes.includes(trimmed)) {
      toast.warning("该题型已添加")
      return
    }
    
    setCustomTypes((prev) => [...prev, trimmed])
    setQuestionTypes((prev) => [...prev, trimmed])
    if (!isRandomDistribution) {
      setQuestionTypeConfig((prev) => ({ ...prev, [trimmed]: 1 }))
    }
    setCustomType("")
  }

  const removeCustomType = (type: string) => {
    setCustomTypes((prev) => prev.filter((t) => t !== type))
    setQuestionTypes((prev) => prev.filter((t) => t !== type))
    setQuestionTypeConfig((prev) => {
      const newConfig = { ...prev }
      delete newConfig[type]
      return newConfig
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      toast.warning("请输入测试主题")
      return
    }

    if (questionTypes.length === 0) {
      toast.warning("请至少选择一种题型")
      return
    }

    // 验证题目数量
    const finalCount = isRandomDistribution ? questionCount : totalCustomCount
    if (finalCount < 1 || finalCount > 50) {
      toast.warning("题目数量必须在 1-50 之间")
      return
    }

    // 随机模式下，题目数量不能少于选中的题型数量
    if (isRandomDistribution && questionCount < questionTypes.length) {
      toast.warning(`随机分配模式下，题目数量不能少于选中的题型数量（${questionTypes.length}）`)
      return
    }

    setIsGenerating(true)
    try {
      await onGenerate({
        topic: topic.trim(),
        difficulty,
        questionCount: finalCount,
        questionTypes,
        questionTypeConfig: isRandomDistribution ? undefined : questionTypeConfig,
        isRandomDistribution,
        additionalContext: additionalContext.trim() || undefined,
        parentDocId,
        currentDocId: currentDoc?.id,
        modelId: selectedModelId, // 传递选中的模型ID
      })

      // 重置表单
      setTopic("")
      setDifficulty('medium')
      setQuestionCount(5)
      setQuestionTypes(['choice', 'multiple-choice', 'true-false'])
      setQuestionTypeConfig({})
      setIsRandomDistribution(true)
      setAdditionalContext("")
      setCustomType("")
      setCustomTypes([])
      onClose()
    } catch (error) {
      console.error('Generation failed:', error)
      toast.error(error instanceof Error ? error.message : '生成测试题失败')
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg">
        {/* 头部 */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            生成测试题
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
            {/* 测试主题 */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                测试主题 <span className="text-red-500">*</span>
              </label>
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={currentDoc ? "自动填充当前章节标题" : "例如：React Hooks"}
                disabled={isGenerating || !!currentDoc}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                required
              />
            </div>

            {/* 难度级别 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                难度级别
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'easy', label: '简单' },
                  { value: 'medium', label: '中等' },
                  { value: 'hard', label: '困难' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDifficulty(option.value as any)}
                    disabled={isGenerating}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                      difficulty === option.value
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

            {/* 分配模式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题型分配模式
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsRandomDistribution(true)}
                  disabled={isGenerating}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2",
                    isRandomDistribution
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Shuffle className="w-4 h-4" />
                  随机分配
                </button>
                <button
                  type="button"
                  onClick={() => setIsRandomDistribution(false)}
                  disabled={isGenerating}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    !isRandomDistribution
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  自定义数量
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {isRandomDistribution 
                  ? "AI 将在选中的题型中随机分配题目数量" 
                  : "为每个题型单独设置题目数量"}
              </p>
            </div>

            {/* 题目数量（随机模式） */}
            {isRandomDistribution && (
              <div>
                <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
                  题目数量
                </label>
                <div className="flex gap-2">
                  <input
                    id="questionCount"
                    type="number"
                    min={questionTypes.length}
                    max="50"
                    value={questionCount}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val >= questionTypes.length && val <= 50) {
                        setQuestionCount(val)
                      }
                    }}
                    disabled={isGenerating}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                  />
                  <span className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center">
                    题
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  最小值：{questionTypes.length}（已选题型数量），最大值：50
                </p>
              </div>
            )}

            {/* 题型选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                题型选择 <span className="text-red-500">*</span>
              </label>
              
              {/* 预定义题型 - 网格布局 */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PREDEFINED_TYPES.map((option) => (
                  <label 
                    key={option.value} 
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer",
                      questionTypes.includes(option.value)
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200 hover:border-teal-300 bg-white"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(option.value)}
                      onChange={() => toggleQuestionType(option.value)}
                      disabled={isGenerating}
                      className="custom-checkbox w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 flex-1">{option.label}</span>
                    {!isRandomDistribution && questionTypes.includes(option.value) && (
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={questionTypeConfig[option.value] || 0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value)
                          if (!isNaN(val)) {
                            updateTypeCount(option.value, val)
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={isGenerating}
                        className="w-14 px-2 py-0.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    )}
                  </label>
                ))}
              </div>

              {/* 自定义题型输入 */}
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  自定义题型
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCustomType()
                      }
                    }}
                    placeholder="例如：案例分析题"
                    disabled={isGenerating}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm"
                    maxLength={10}
                  />
                  <button
                    type="button"
                    onClick={addCustomType}
                    disabled={isGenerating || !customType.trim()}
                    className="px-3 py-1.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 已添加的自定义题型 */}
              {customTypes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    自定义题型
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {customTypes.map((type) => (
                      <div
                        key={type}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all",
                          questionTypes.includes(type)
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-200 bg-white"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={questionTypes.includes(type)}
                          onChange={() => toggleQuestionType(type)}
                          disabled={isGenerating}
                          className="custom-checkbox w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm text-teal-700 flex-1">{type}</span>
                        {!isRandomDistribution && questionTypes.includes(type) && (
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={questionTypeConfig[type] || 0}
                            onChange={(e) => {
                              const val = parseInt(e.target.value)
                              if (!isNaN(val)) {
                                updateTypeCount(type, val)
                              }
                            }}
                            disabled={isGenerating}
                            className="w-14 px-2 py-0.5 border border-gray-300 rounded text-xs text-center focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeCustomType(type)}
                          disabled={isGenerating}
                          className="text-teal-600 hover:text-teal-800 transition-colors disabled:opacity-50"
                          aria-label={`删除 ${type}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 统计信息 */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  已选择 {questionTypes.length} 种题型
                </span>
                {!isRandomDistribution && (
                  <span className={cn(
                    "font-medium",
                    totalCustomCount < 1 || totalCustomCount > 50 ? "text-red-500" : "text-teal-600"
                  )}>
                    总计：{totalCustomCount} 题
                  </span>
                )}
              </div>

              {questionTypes.length === 0 && (
                <p className="text-xs text-red-500 mt-2">请至少选择一种题型</p>
              )}
            </div>

            {/* 补充说明 */}
            <div>
              <label htmlFor="additionalContext" className="block text-sm font-medium text-gray-700 mb-2">
                补充说明 <span className="text-gray-400 text-xs">(可选)</span>
              </label>
              <textarea
                id="additionalContext"
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="例如：重点考察实际应用、包含代码示例、侧重概念理解等"
                disabled={isGenerating}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 text-sm resize-none"
              />
            </div>

            {/* 提示信息 */}
            {currentDoc && (
              <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  将为「{currentDoc.title}」生成测试题
                </p>
              </div>
            )}
          </div>
        </form>

        {/* 底部按钮 */}
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
            disabled={
              isGenerating || 
              !topic.trim() || 
              questionTypes.length === 0 || 
              (isRandomDistribution && (questionCount < questionTypes.length || questionCount > 50)) ||
              (!isRandomDistribution && (totalCustomCount < 1 || totalCustomCount > 50))
            }
            className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-colors disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                生成 {isRandomDistribution ? questionCount : totalCustomCount} 题
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
