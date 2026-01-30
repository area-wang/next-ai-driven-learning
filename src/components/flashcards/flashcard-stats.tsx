'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface FlashcardStatsProps {
  contentId?: string
}

interface Stats {
  totalCards: number
  dueCards: number
  masteredCards: number
  newCards: number
  learningCards: number
  totalReviews: number
  avgQuality: number
  recentReviews: Array<{
    date: string
    count: number
    avgQuality: number
  }>
}

export function FlashcardStats({ contentId }: FlashcardStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [contentId])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (contentId) params.append('contentId', contentId)

      const response = await fetch(`/api/flashcards/stats?${params}`)
      const result = await response.json() as { success: boolean; data?: Stats; error?: string }

      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const masteryRate = stats.totalCards > 0
    ? Math.round((stats.masteredCards / stats.totalCards) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">总卡片</div>
          <div className="text-2xl font-bold">{stats.totalCards}</div>
        </Card>

        <Card className="p-4 border-orange-200 bg-orange-50">
          <div className="text-sm text-orange-600 mb-1">待复习</div>
          <div className="text-2xl font-bold text-orange-600">{stats.dueCards}</div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm text-green-600 mb-1">已掌握</div>
          <div className="text-2xl font-bold text-green-600">{stats.masteredCards}</div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm text-blue-600 mb-1">学习中</div>
          <div className="text-2xl font-bold text-blue-600">{stats.learningCards}</div>
        </Card>
      </div>

      {/* 详细统计 */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">学习统计</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">新卡片</span>
            <span className="font-medium">{stats.newCards}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">总复习次数</span>
            <span className="font-medium">{stats.totalReviews}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">平均复习质量</span>
            <span className="font-medium">{stats.avgQuality.toFixed(1)} / 5.0</span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">掌握率</span>
              <span className="font-medium">{masteryRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${masteryRate}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* 最近7天复习记录 */}
      {stats.recentReviews.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">最近7天复习</h3>
          
          <div className="space-y-3">
            {stats.recentReviews.map((review) => (
              <div key={review.date} className="flex items-center gap-4">
                <div className="text-sm text-gray-600 w-24">
                  {new Date(review.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min((review.count / 20) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {review.count}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-16 text-right">
                  质量 {review.avgQuality.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
