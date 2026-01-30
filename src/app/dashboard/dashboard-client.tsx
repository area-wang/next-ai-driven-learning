'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface DashboardData {
  stats: {
    activePlans: number
    completedContents: number
    totalHours: number
    progressIndex: number
  }
  recentPlans: Array<{
    id: string
    title: string
    progress: number
    status: string
    lastAccess: string
  }>
  todayReviews: Array<{
    id: string
    planId: string
    planTitle: string
    outlineId: string
    outlineTitle: string
    reviewRound: number
    scheduledAt: Date
  }>
}

interface DashboardClientProps {
  userName: string
}

export function DashboardClient({ userName }: DashboardClientProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json() as { success: boolean; data: DashboardData }
        if (result.success) {
          setDashboardData(result.data)
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    )
  }

  const stats = dashboardData ? [
    { 
      label: "学习计划", 
      value: dashboardData.stats.activePlans.toString(), 
      icon: BookOpen, 
      color: "text-blue-500" 
    },
    { 
      label: "完成目标", 
      value: dashboardData.stats.completedContents.toString(), 
      icon: Target, 
      color: "text-green-500" 
    },
    { 
      label: "学习时长", 
      value: `${dashboardData.stats.totalHours}h`, 
      icon: Clock, 
      color: "text-orange-500" 
    },
    { 
      label: "进步指数", 
      value: `${dashboardData.stats.progressIndex > 0 ? '+' : ''}${dashboardData.stats.progressIndex}%`, 
      icon: TrendingUp, 
      color: dashboardData.stats.progressIndex >= 0 ? "text-purple-500" : "text-red-500" 
    },
  ] : [
    { label: "学习计划", value: "0", icon: BookOpen, color: "text-blue-500" },
    { label: "完成目标", value: "0", icon: Target, color: "text-green-500" },
    { label: "学习时长", value: "0h", icon: Clock, color: "text-orange-500" },
    { label: "进步指数", value: "0%", icon: TrendingUp, color: "text-purple-500" },
  ]

  const recentPlans = dashboardData?.recentPlans || []
  const todayReviews = dashboardData?.todayReviews || []

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            欢迎回来，{userName}！
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            继续您的学习之旅，今天也要加油哦
          </p>
        </div>
        <Link href="/learn/new">
          <Button variant="cta">
            <Plus className="w-4 h-4 mr-2" />
            新建学习计划
          </Button>
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} variant="glass" hover="lift">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-[var(--color-text)] mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-gray-100 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 今日复习提醒 */}
      {todayReviews.length > 0 && (
        <Card variant="glass" className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">今日复习提醒</CardTitle>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                您有 {todayReviews.length} 个内容需要复习
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/plan/${review.planId}`}
                  className="block p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <h3 className="font-medium text-[var(--color-text)]">
                          {review.outlineTitle}
                        </h3>
                      </div>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {review.planTitle} · 第 {review.reviewRound} 轮复习
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                      待复习
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近学习 */}
      {recentPlans.length > 0 && (
        <Card variant="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>最近学习</CardTitle>
            <Link href="/learn">
              <Button variant="ghost" size="sm">
                查看全部
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/plan/${plan.id}`}
                  className="block p-4 rounded-xl bg-white/50 hover:bg-white/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-[var(--color-text)]">
                      {plan.title}
                    </h3>
                    <Badge
                      variant={plan.status === "已完成" ? "success" : "secondary"}
                    >
                      {plan.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={plan.progress} />
                    </div>
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {plan.progress}%
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    上次学习: {plan.lastAccess}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态提示 */}
      {recentPlans.length === 0 && (
        <Card variant="glass">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
              还没有学习计划
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              创建您的第一个学习计划，开始学习之旅
            </p>
            <Link href="/learn/new">
              <Button variant="cta">
                <Plus className="w-4 h-4 mr-2" />
                创建学习计划
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* 快速操作 */}
      {recentPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="glass" hover="lift">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
                  <BookOpen className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-[var(--color-text)]">
                    继续学习
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {recentPlans[0].title}
                  </p>
                </div>
                <Link href={`/plan/${recentPlans[0].id}`}>
                  <Button variant="default" size="sm">
                    继续
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {todayReviews.length > 0 && (
            <Card variant="glass" hover="lift">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-[var(--color-cta)]/10">
                    <Target className="w-6 h-6 text-[var(--color-cta)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-[var(--color-text)]">
                      今日复习
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {todayReviews.length} 个内容待复习
                    </p>
                  </div>
                  <Link href={`/plan/${todayReviews[0].planId}`}>
                    <Button variant="outline" size="sm">
                      开始
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
