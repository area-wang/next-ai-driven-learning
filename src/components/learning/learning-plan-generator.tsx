/**
 * 学习计划生成器组件
 */

'use client'

import { useState } from 'react'
import { Loader2, Sparkles, Target, Clock, BookOpen } from 'lucide-react'
import { ConfiguredModelSelector } from '@/components/ai/configured-model-selector'

interface LearningPlanPhase {
  title: string
  duration: string
  topics: string[]
  resources: string[]
}

interface LearningPlan {
  title: string
  description: string
  goals: string[]
  phases: LearningPlanPhase[]
  id?: string
  saved?: boolean
}

interface LearningPlanGeneratorProps {
  userId?: string
  onPlanGenerated?: (plan: LearningPlan) => void
}

export function LearningPlanGenerator({ userId, onPlanGenerated }: LearningPlanGeneratorProps) {
  const [topic, setTopic] = useState('')
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')
  const [duration, setDuration] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<LearningPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedModelId, setSelectedModelId] = useState<string>('')

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('请输入学习主题')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedPlan(null)

    try {
      const response = await fetch('/api/learning-plan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          goal: goal.trim() || undefined,
          level,
          duration: duration.trim() || undefined,
          modelId: selectedModelId, // 传递 modelId 给后端
          userId,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || '生成失败')
      }

      const plan = await response.json() as LearningPlan
      setGeneratedPlan(plan)
      onPlanGenerated?.(plan)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 输入表单 */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600" />
          生成学习计划
        </h2>

        <div className="space-y-4">
          {/* 模型选择器 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              选择模型
            </label>
            <ConfiguredModelSelector
              value={selectedModelId}
              onChange={setSelectedModelId}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              学习主题 *
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="例如：Python 编程、机器学习、Web 开发"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              学习目标（可选）
            </label>
            <input
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="例如：找到一份数据分析工作、开发个人项目"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                难度级别
              </label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="beginner">初级</option>
                <option value="intermediate">中级</option>
                <option value="advanced">高级</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                预计时长（可选）
              </label>
              <input
                type="text"
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="例如：3个月、6周"
                className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim() || !selectedModelId}
            className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                生成学习计划
              </>
            )}
          </button>
        </div>
      </div>

      {/* 生成的计划 */}
      {generatedPlan && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {generatedPlan.title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {generatedPlan.description}
            </p>
            {generatedPlan.saved && (
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm rounded">
                ✓ 已保存
              </div>
            )}
          </div>

          {/* 学习目标 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />
              学习目标
            </h3>
            <ul className="space-y-2">
              {generatedPlan.goals.map((goal, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-slate-700 dark:text-slate-300"
                >
                  <span className="text-teal-600 mt-1">•</span>
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 学习阶段 */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" />
              学习阶段
            </h3>
            <div className="space-y-4">
              {generatedPlan.phases.map((phase, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      阶段 {index + 1}: {phase.title}
                    </h4>
                    <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                      <Clock className="w-4 h-4" />
                      {phase.duration}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        学习主题：
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {phase.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {phase.resources.length > 0 && (
                      <div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          推荐资源：
                        </div>
                        <ul className="space-y-1">
                          {phase.resources.map((resource, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"
                            >
                              <span className="text-teal-600">→</span>
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
