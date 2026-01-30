'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

interface PomodoroStatsProps {
  startDate?: Date
  endDate?: Date
}

interface Stats {
  totalSessions: number
  completedSessions: number
  totalDuration: number
  completionRate: number
  dailyStats: Array<{
    date: string
    sessions: number
    completedSessions: number
    duration: number
  }>
  typeStats: Array<{
    sessionType: string
    count: number
    completedCount: number
  }>
}

export function PomodoroStats({ startDate, endDate }: PomodoroStatsProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [startDate, endDate])

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate.toISOString())
      if (endDate) params.append('endDate', endDate.toISOString())

      const response = await fetch(`/api/pomodoro/stats?${params}`)
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      work: '工作',
      short_break: '短休息',
      long_break: '长休息',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600 mb-1">总会话</div>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
        </Card>

        <Card className="p-4 border-green-200 bg-green-50">
          <div className="text-sm text-green-600 mb-1">已完成</div>
          <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
        </Card>

        <Card className="p-4 border-blue-200 bg-blue-50">
          <div className="text-sm text-blue-600 mb-1">总时长</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatDuration(stats.totalDuration)}
          </div>
        </Card>

        <Card className="p-4 border-purple-200 bg-purple-50">
          <div className="text-sm text-purple-600 mb-1">完成率</div>
          <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
        </Card>
      </div>

      {/* 按类型统计 */}
      {stats.typeStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">会话类型</h3>
          <div className="space-y-3">
            {stats.typeStats.map((typeStat) => (
              <div key={typeStat.sessionType} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{getTypeLabel(typeStat.sessionType)}</span>
                  <span className="text-sm text-gray-600">
                    {typeStat.completedCount} / {typeStat.count}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${typeStat.count > 0 ? (typeStat.completedCount / typeStat.count) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {typeStat.count > 0 ? Math.round((typeStat.completedCount / typeStat.count) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 每日统计 */}
      {stats.dailyStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">每日统计</h3>
          <div className="space-y-3">
            {stats.dailyStats.slice(-7).map((dayStat) => (
              <div key={dayStat.date} className="flex items-center gap-4">
                <div className="text-sm text-gray-600 w-24">
                  {new Date(dayStat.date).toLocaleDateString('zh-CN', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((dayStat.sessions / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {dayStat.completedSessions}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-20 text-right">
                  {formatDuration(dayStat.duration)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
