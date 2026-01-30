'use client'

import { useState } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/toast-container'

interface ReviewCardProps {
  schedule: {
    id: string
    reviewRound: number
    scheduledAt: Date
    contentId: string
  }
  content: {
    id: string
    content: string
  }
  outline: {
    title: string
  }
  onComplete?: () => void
}

export function ReviewCard({ schedule, content, outline, onComplete }: ReviewCardProps) {
  const [showContent, setShowContent] = useState(false)
  const [effectiveness, setEffectiveness] = useState<number>(3)
  const [completing, setCompleting] = useState(false)
  const toast = useToast()

  const handleComplete = async () => {
    try {
      setCompleting(true)
      const response = await fetch('/api/review/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: schedule.id,
          effectiveness,
        }),
      })

      const data = await response.json() as {
        success: boolean
        error?: string
      }

      if (data.success) {
        toast.success('复习完成！')
        onComplete?.()
      } else {
        toast.error(data.error || '完成复习失败')
      }
    } catch (error) {
      console.error('完成复习失败:', error)
      toast.error('完成复习失败')
    } finally {
      setCompleting(false)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    return '刚刚'
  }

  const isOverdue = new Date(schedule.scheduledAt) < new Date()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{outline.title}</h4>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              第 {schedule.reviewRound} 轮复习
            </span>
            <span className={isOverdue ? 'text-red-600 flex items-center gap-1' : ''}>
              {isOverdue && <AlertCircle className="w-4 h-4" />}
              {formatTime(schedule.scheduledAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 内容预览/显示 */}
      {!showContent ? (
        <button
          onClick={() => setShowContent(true)}
          className="w-full py-2 px-4 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm font-medium"
        >
          点击查看内容
        </button>
      ) : (
        <div className="space-y-4">
          {/* 内容显示 */}
          <div 
            className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg"
            dangerouslySetInnerHTML={{ __html: content.content }}
          />

          {/* 复习效果评分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              复习效果评分
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={score}
                  onClick={() => setEffectiveness(score)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                    ${effectiveness === score
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {score}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>完全忘记</span>
              <span>完全记得</span>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex-1 py-2 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {completing ? '提交中...' : '完成复习'}
            </button>
            <button
              onClick={() => setShowContent(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              收起
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
