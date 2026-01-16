import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  BookOpen,
  Target,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata = {
  title: "仪表板 - AI学习平台",
}

const stats = [
  { label: "学习计划", value: "3", icon: BookOpen, color: "text-blue-500" },
  { label: "完成目标", value: "12", icon: Target, color: "text-green-500" },
  { label: "学习时长", value: "24h", icon: Clock, color: "text-orange-500" },
  { label: "进步指数", value: "+15%", icon: TrendingUp, color: "text-purple-500" },
]

const recentPlans = [
  {
    id: "1",
    title: "JavaScript 高级编程",
    progress: 65,
    status: "进行中",
    lastAccess: "2小时前",
  },
  {
    id: "2",
    title: "React 框架入门",
    progress: 30,
    status: "进行中",
    lastAccess: "1天前",
  },
  {
    id: "3",
    title: "TypeScript 基础",
    progress: 100,
    status: "已完成",
    lastAccess: "3天前",
  },
]

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      {/* 欢迎区域 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            欢迎回来，{session.user.name || "学习者"}！
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

      {/* 最近学习 */}
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
                href={`/learn/${plan.id}`}
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

      {/* 快速操作 */}
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
                  JavaScript 高级编程 - 第3章
                </p>
              </div>
              <Button variant="default" size="sm">
                继续
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass" hover="lift">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[var(--color-cta)]/10">
                <Target className="w-6 h-6 text-[var(--color-cta)]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-[var(--color-text)]">
                  今日测试
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  完成5道练习题巩固知识
                </p>
              </div>
              <Button variant="outline" size="sm">
                开始
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
