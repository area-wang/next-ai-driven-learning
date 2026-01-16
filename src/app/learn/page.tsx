import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, BookOpen, Clock, MoreVertical } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const metadata = {
  title: "学习计划 - AI学习平台",
}

// 模拟数据
const learningPlans = [
  {
    id: "1",
    title: "JavaScript 高级编程",
    description: "深入学习JavaScript的高级特性，包括闭包、原型链、异步编程等",
    topic: "JavaScript",
    level: "高级",
    progress: 65,
    status: "active",
    totalItems: 24,
    completedItems: 16,
    estimatedTime: "40小时",
    lastAccess: "2小时前",
  },
  {
    id: "2",
    title: "React 框架入门",
    description: "从零开始学习React，掌握组件化开发和状态管理",
    topic: "React",
    level: "入门",
    progress: 30,
    status: "active",
    totalItems: 18,
    completedItems: 5,
    estimatedTime: "30小时",
    lastAccess: "1天前",
  },
  {
    id: "3",
    title: "TypeScript 基础",
    description: "学习TypeScript的类型系统和高级类型",
    topic: "TypeScript",
    level: "中级",
    progress: 100,
    status: "completed",
    totalItems: 15,
    completedItems: 15,
    estimatedTime: "20小时",
    lastAccess: "3天前",
  },
]

export default async function LearnPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            我的学习计划
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            管理和追踪您的学习进度
          </p>
        </div>
        <Link href="/learn/new">
          <Button variant="cta">
            <Plus className="w-4 h-4 mr-2" />
            新建学习计划
          </Button>
        </Link>
      </div>

      {/* 学习计划列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {learningPlans.map((plan) => (
          <Card key={plan.id} variant="glass" hover="lift" className="overflow-hidden">
            <CardContent className="p-0">
              {/* 顶部颜色条 */}
              <div
                className={`h-2 ${
                  plan.status === "completed"
                    ? "bg-green-500"
                    : "bg-[var(--color-primary)]"
                }`}
              />

              <div className="p-5">
                {/* 标题和操作 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      href={`/learn/${plan.id}`}
                      className="text-lg font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                    >
                      {plan.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {plan.topic}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {plan.level}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="cursor-pointer">
                        编辑
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        归档
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-red-600">
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* 描述 */}
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-4">
                  {plan.description}
                </p>

                {/* 进度 */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--color-text-secondary)]">
                      进度
                    </span>
                    <span className="font-medium text-[var(--color-text)]">
                      {plan.completedItems}/{plan.totalItems} 章节
                    </span>
                  </div>
                  <Progress value={plan.progress} />
                </div>

                {/* 底部信息 */}
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{plan.estimatedTime}</span>
                  </div>
                  <span>上次学习: {plan.lastAccess}</span>
                </div>

                {/* 操作按钮 */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Link href={`/learn/${plan.id}`} className="block">
                    <Button
                      variant={plan.status === "completed" ? "outline" : "default"}
                      className="w-full"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {plan.status === "completed" ? "复习" : "继续学习"}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 新建计划卡片 */}
        <Link href="/learn/new">
          <Card
            variant="outline"
            hover="lift"
            className="h-full min-h-[280px] border-dashed border-2 flex items-center justify-center"
          >
            <CardContent className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)]/30 flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-[var(--color-primary)]" />
              </div>
              <p className="font-medium text-[var(--color-text)]">
                创建新的学习计划
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                让AI为您生成个性化学习内容
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
