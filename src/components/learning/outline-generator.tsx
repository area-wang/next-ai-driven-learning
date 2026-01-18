/**
 * 学习大纲生成器组件
 */

'use client'

import { useState } from 'react'
import { Loader2, Sparkles, List } from 'lucide-react'
import { useAIConfig } from '@/hooks/use-ai-config'
import { OutlineTree, type OutlineItem } from './outline-tree'

interface OutlineGeneratorProps {
  planId?: string
  defaultTopic?: string
  defaultLevel?: 'beginner' | 'intermediate' | 'advanced'
  onOutlineGenerated?: (outline: OutlineItem[]) => void
}

export function OutlineGenerator({
  planId,
  defaultTopic = '',
  defaultLevel = 'beginner',
  onOutlineGenerated,
}: OutlineGeneratorProps) {
  const { config, hasApiKey } = useAIConfig()
  const [topic, setTopic] = useState(defaultTopic)
  const [goal, setGoal] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(defaultLevel)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOutline, setGeneratedOutline] = useState<OutlineItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const needsApiKey = config.provider !== 'cloudflare' && !hasApiKey()

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('请输入学习主题')
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedOutline(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (config.provider !== 'cloudflare' && hasApiKey()) {
        headers['x-api-key'] = config.apiKeys[config.provider] || ''
      }

      const response = await fetch('/api/learning-outline/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          planId,
          topic: topic.trim(),
          goal: goal.trim() || undefined,
          level,
          provider: config.provider,
          model: config.model,
        }),
      })

      if (!response.ok) {
        const data = await response.json() as { error?: string }
        throw new Error(data.error || '生成失败')
      }

      const data = await response.json() as { outline: OutlineItem[], saved?: boolean }
      setGeneratedOutline(data.outline)
      onOutlineGenerated?.(data.outline)
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
          <List className="w-5 h-5 text-teal-600" />
          生成学习大纲
        </h2>

        <div className="space-y-4">
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
              placeholder="例如：掌握基础语法、能够独立开发项目"
              className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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

          {needsApiKey && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg text-sm text-orange-800 dark:text-orange-200">
              当前模型需要 API Key。请前往{' '}
              <a href="/settings/ai" className="underline font-medium cursor-pointer">
                设置页面
              </a>{' '}
              配置，或切换到免费的 Cloudflare AI。
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-800 dark:text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || needsApiKey || !topic.trim()}
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
                生成学习大纲
              </>
            )}
          </button>
        </div>
      </div>

      {/* 生成的大纲 */}
      {generatedOutline && (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            学习大纲
          </h2>
          <OutlineTree items={generatedOutline} />
        </div>
      )}
    </div>
  )
}
