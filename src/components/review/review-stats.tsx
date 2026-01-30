'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, CheckCircle, Clock, Target } from 'lucide-react'

interface ReviewStatsProps {
  contentId?: string
}

interface StatsData {
  overview: {
    total: number
    completed: number
    pending: number
    completionRate: number
    progress: number
  }
  roundStats: Array<{
    round: number
    total: number
    completed: number
    avgEffectiveness: number
  }>
}

export function ReviewStats({ contentId }: ReviewStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [contentId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (contentId) params.append('contentId', contentId)

      const response = await fetch(`/api/review/stats?${params}`)
      const data = await response.json() as {
        success: boolean
        data?: StatsData
      }

      if (data.success && data.data) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const { overview, roundStats } = stats

  return (
    <div className="space-y-4">
      {/* 总体统计 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          复习统计
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{overview.total}</div>
            <div className="text-sm text-gray-600 mt-1">总复习次数</div>
          </div>

          <div className="text-center p-4 bg-teal-50 rounded-lg">
            <div className="text-2xl font-bold text-teal-600">{overview.completed}</div>
            <div className="text-sm text-gray-600 mt-1">已完成</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{overview.pending}</div>
            <div className="text-sm text-gray-600 mt-1">待复习</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{overview.completionRate}%</div>
            <div className="text-sm text-gray-600 mt-1">完成率</div>
          </div>
        </div>

        {/* 进度条 */}
        {contentId && overview.progress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>复习进度</span>
              <span className="font-medium">{overview.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${overview.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 按轮次统计 */}
      {roundStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-teal-600" />
            各轮次统计
          </h3>

          <div className="space-y-3">
            {roundStats.map((round) => {
              const completionRate = round.total > 0
                ? Math.round((round.completed / round.total) * 100)
                : 0

              return (
                <div key={round.round} className="flex items-center gap-4">
                  <div className="w-16 text-sm font-medium text-gray-700">
                    第 {round.round} 轮
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{round.completed} / {round.total}</span>
                      <span>{completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {round.avgEffectiveness > 0 && (
                    <div className="text-sm text-gray-600">
                      效果: {round.avgEffectiveness.toFixed(1)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
