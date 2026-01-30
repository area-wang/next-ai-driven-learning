'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'

export function ReviewReminder() {
  const [dueCount, setDueCount] = useState(0)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    loadDueCount()
    
    // 每5分钟检查一次
    const interval = setInterval(loadDueCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadDueCount = async () => {
    try {
      const response = await fetch('/api/review/due?type=today')
      const data = await response.json() as {
        success: boolean
        count?: {
          today: number
          overdue: number
        }
      }

      if (data.success && data.count) {
        const count = data.count.today + data.count.overdue
        setDueCount(count)
        
        // 如果有待复习内容且未被关闭，显示提醒
        if (count > 0 && !dismissed) {
          setShow(true)
        }
      }
    } catch (error) {
      console.error('加载待复习数量失败:', error)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    
    // 1小时后重新显示
    setTimeout(() => {
      setDismissed(false)
      if (dueCount > 0) {
        setShow(true)
      }
    }, 60 * 60 * 1000)
  }

  if (!show || dueCount === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-teal-600" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">
              复习提醒
            </h4>
            <p className="text-sm text-gray-600">
              你有 <span className="font-semibold text-teal-600">{dueCount}</span> 项内容需要复习
            </p>
            <a
              href="/dashboard?tab=review"
              className="inline-block mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              立即复习 →
            </a>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
