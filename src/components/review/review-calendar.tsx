'use client'

import { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'

interface ReviewDay {
  date: string
  count: number
  completed: number
}

interface ReviewCalendarProps {
  contentId?: string
  onDateSelect?: (date: string) => void
}

export function ReviewCalendar({ contentId, onDateSelect }: ReviewCalendarProps) {
  const [reviewDays, setReviewDays] = useState<ReviewDay[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReviewData()
  }, [contentId, currentMonth])

  const loadReviewData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (contentId) params.append('contentId', contentId)
      params.append('days', '30')

      const response = await fetch(`/api/review/stats?${params}`)
      const data = await response.json() as {
        success: boolean
        data?: {
          recentReviews: Array<{ date: string; count: number }>
        }
      }

      if (data.success && data.data) {
        // 转换数据格式
        const days: ReviewDay[] = data.data.recentReviews.map((r) => ({
          date: r.date,
          count: r.count,
          completed: r.count,
        }))
        setReviewDays(days)
      }
    } catch (error) {
      console.error('加载复习数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay()

    const days = []
    
    // 填充上个月的日期
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // 填充本月的日期
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const reviewDay = reviewDays.find(d => d.date === dateStr)
      
      days.push({
        date: i,
        dateStr,
        count: reviewDay?.count || 0,
        completed: reviewDay?.completed || 0,
      })
    }

    return days
  }

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + offset)
    setCurrentMonth(newMonth)
  }

  const days = getDaysInMonth()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">复习日历</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium min-w-[100px] text-center">
            {currentMonth.getFullYear()}年{currentMonth.getMonth() + 1}月
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const hasReview = day.count > 0
          const isToday = day.dateStr === new Date().toISOString().split('T')[0]

          return (
            <button
              key={day.dateStr}
              onClick={() => onDateSelect?.(day.dateStr)}
              className={`
                aspect-square rounded-lg flex flex-col items-center justify-center text-sm
                transition-all hover:scale-105
                ${isToday ? 'ring-2 ring-teal-500' : ''}
                ${hasReview ? 'bg-teal-100 text-teal-900 font-medium' : 'bg-gray-50 text-gray-700'}
                ${hasReview ? 'hover:bg-teal-200' : 'hover:bg-gray-100'}
              `}
            >
              <span>{day.date}</span>
              {hasReview && (
                <span className="text-[10px] text-teal-600">{day.count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 图例 */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-teal-100" />
          <span>有复习</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-50" />
          <span>无复习</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded ring-2 ring-teal-500" />
          <span>今天</span>
        </div>
      </div>
    </div>
  )
}
