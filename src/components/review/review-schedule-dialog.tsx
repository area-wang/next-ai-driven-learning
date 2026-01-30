'use client'

import { useState, useEffect } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Calendar } from 'lucide-react'

interface ReviewSchedule {
  id: string
  reviewRound: number
  scheduledAt: string
  status: 'pending' | 'completed'
  completedAt?: string | null
  effectiveness?: number | null
  nextReviewAt?: string | null
}

interface ReviewScheduleDialogProps {
  isOpen: boolean
  onClose: () => void
  outlineId: string
}

export function ReviewScheduleDialog({
  isOpen,
  onClose,
  outlineId,
}: ReviewScheduleDialogProps) {
  const [schedules, setSchedules] = useState<ReviewSchedule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
  })

  // 加载复习计划
  const loadSchedules = async () => {
    if (!outlineId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/review/schedules?outlineId=${outlineId}`)
      const data = await response.json() as {
        success: boolean
        data?: ReviewSchedule[]
        stats?: {
          total: number
          pending: number
          completed: number
          overdue: number
        }
        error?: string
      }

      if (data.success) {
        setSchedules(data.data || [])
        setStats(data.stats || { total: 0, pending: 0, completed: 0, overdue: 0 })
      } else {
        console.error('加载复习计划失败:', data.error)
      }
    } catch (error) {
      console.error('加载复习计划失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建复习计划
  const handleCreateSchedule = async () => {
    if (!outlineId) return

    setIsCreating(true)
    try {
      const response = await fetch('/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outlineId }),
      })

      const data = await response.json() as {
        success: boolean
        error?: string
      }

      if (data.success) {
        // 重新加载复习计划
        await loadSchedules()
      } else {
        alert(data.error || '创建复习计划失败')
      }
    } catch (error) {
      console.error('创建复习计划失败:', error)
      alert('创建复习计划失败')
    } finally {
      setIsCreating(false)
    }
  }

  // 完成复习
  const handleCompleteReview = async (scheduleId: string, effectiveness: number) => {
    try {
      const response = await fetch('/api/review/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId, effectiveness }),
      })

      const data = await response.json() as {
        success: boolean
        error?: string
      }

      if (data.success) {
        // 重新加载复习计划
        await loadSchedules()
      } else {
        alert(data.error || '完成复习失败')
      }
    } catch (error) {
      console.error('完成复习失败:', error)
      alert('完成复习失败')
    }
  }

  // 格式化日期 - 只显示日期和相对天数，不显示具体时间
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    
    // 获取日期部分（忽略时间）
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // 计算天数差异（基于日期，不是时间戳）
    const diffMs = dateOnly.getTime() - nowOnly.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    const formatted = date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    })

    if (diffDays === 0) {
      return `${formatted} (今天)`
    } else if (diffDays === 1) {
      return `${formatted} (明天)`
    } else if (diffDays > 1) {
      return `${formatted} (${diffDays}天后)`
    } else if (diffDays === -1) {
      return `${formatted} (昨天)`
    } else {
      return `${formatted} (${Math.abs(diffDays)}天前)`
    }
  }

  // 获取当天的复习轮次
  const getTodayRounds = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledAt)
      scheduleDate.setHours(0, 0, 0, 0)
      return scheduleDate.getTime() === today.getTime()
    })
  }

  // 获取复习轮次描述
  const getReviewDescription = (schedule: ReviewSchedule) => {
    const todayRounds = getTodayRounds()
    const isToday = todayRounds.some(r => r.id === schedule.id)
    
    if (isToday && todayRounds.length > 1) {
      const roundIndex = todayRounds.findIndex(r => r.id === schedule.id)
      return `今天第 ${roundIndex + 1} 次复习（共 ${todayRounds.length} 次）`
    }
    
    return null
  }

  // 获取状态徽章
  const getStatusBadge = (schedule: ReviewSchedule) => {
    if (schedule.status === 'completed') {
      return <Badge variant="default" className="bg-green-500">已完成</Badge>
    }

    const scheduledDate = new Date(schedule.scheduledAt)
    const now = new Date()

    if (scheduledDate < now) {
      return <Badge variant="destructive">已逾期</Badge>
    }

    return <Badge variant="secondary">待复习</Badge>
  }

  // 当对话框打开时加载数据
  useEffect(() => {
    if (isOpen && outlineId) {
      loadSchedules()
    }
  }, [isOpen])

  return (
    <Drawer open={isOpen} onOpenChange={onClose} side="right">
      <DrawerContent>
        <DrawerHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                复习计划
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                基于艾宾浩斯遗忘曲线
              </p>
            </div>
          </div>

          {/* 统计信息 */}
          {schedules.length > 0 && (
            <div className="flex gap-3">
              <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3">
                <div className="text-xs text-gray-600 mb-1">总计</div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3">
                <div className="text-xs text-blue-600 mb-1">待复习</div>
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
              </div>
              <div className="flex-1 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3">
                <div className="text-xs text-green-600 mb-1">已完成</div>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
              {stats.overdue > 0 && (
                <div className="flex-1 bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-3">
                  <div className="text-xs text-red-600 mb-1">已逾期</div>
                  <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
                </div>
              )}
            </div>
          )}
        </DrawerHeader>

        <DrawerBody>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" />
              <p className="text-gray-500 mt-4">加载中...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium mb-2">还没有复习计划</p>
              <p className="text-gray-500 text-sm mb-6 text-center max-w-sm">
                创建复习计划后，系统将根据艾宾浩斯遗忘曲线为您安排 8 轮复习（第一天2次，第二天2次）
              </p>
              <Button
                onClick={handleCreateSchedule}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/30"
              >
                {isCreating ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    创建中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    创建复习计划
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="group relative bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {schedule.reviewRound}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base font-semibold text-gray-900">
                              第 {schedule.reviewRound} 轮复习
                            </span>
                            {getStatusBadge(schedule)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(schedule.scheduledAt)}
                          </div>
                          {getReviewDescription(schedule) && (
                            <div className="text-xs text-blue-600 mt-1">
                              {getReviewDescription(schedule)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {schedule.completedAt && (
                        <div className="ml-13 space-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            完成时间: {formatDate(schedule.completedAt)}
                          </div>
                          {schedule.effectiveness && (
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              复习效果: {schedule.effectiveness}/5
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 完成按钮 */}
                    {schedule.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteReview(schedule.id, 5)}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        完成
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            onClick={onClose}
            variant="outline"
          >
            关闭
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
