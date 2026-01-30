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
import { createDbClient } from "@/db/client"
import { learningPlans } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { getCloudflareContext } from "@opennextjs/cloudflare"
import { getUserIdOrDemo } from "@/lib/auth/get-user"

export const metadata = {
  title: "学习计划 - AI学习平台",
}

// 格式化时间差
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

// 获取难度级别的中文标签
function getLevelLabel(level: string | null): string {
  switch (level) {
    case 'beginner': return '入门'
    case 'intermediate': return '中级'
    case 'advanced': return '高级'
    default: return '未知'
  }
}

export default async function LearnPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/auth/login")
  }

  // 获取用户 ID（与仪表盘保持一致）
  const userId = await getUserIdOrDemo()

  // 从数据库获取学习计划
  let plans: any[] = []
  
  try {
    const context = getCloudflareContext()
    if (context?.env?.DB) {
      const db = createDbClient(context.env.DB as D1Database)
      // 获取当前用户的所有学习计划
      plans = await db
        .select()
        .from(learningPlans)
        .where(eq(learningPlans.userId, userId))
        .orderBy(desc(learningPlans.updatedAt))
      
      console.log('=== 学习计划页面调试 ===')
      console.log('用户ID:', userId)
      console.log('学习计划数量:', plans.length)
      console.log('计划列表:', plans.map(p => ({ id: p.id, title: p.title, status: p.status })))
      console.log('======================\n')
    }
  } catch (error) {
    console.error('Failed to fetch learning plans:', error)
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
        {plans.length === 0 ? (
          // 空状态
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[var(--color-secondary)]/30 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-[var(--color-primary)]" />
            </div>
            <h3 className="text-lg font-medium text-[var(--color-text)] mb-2">
              还没有学习计划
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              创建您的第一个学习计划，开始AI辅助学习之旅
            </p>
            <Link href="/learn/new">
              <Button variant="cta">
                <Plus className="w-4 h-4 mr-2" />
                创建学习计划
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {plans.map((plan) => (
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
                          href={`/plan/${plan.id}`}
                          className="text-lg font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                        >
                          {plan.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {plan.topic}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {getLevelLabel(plan.level)}
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
                      {plan.description || '暂无描述'}
                    </p>

                    {/* 进度 */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">
                          进度
                        </span>
                        <span className="font-medium text-[var(--color-text)]">
                          {plan.progress}%
                        </span>
                      </div>
                      <Progress value={plan.progress || 0} />
                    </div>

                    {/* 底部信息 */}
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>预计学习时间</span>
                      </div>
                      <span>创建于: {formatTimeAgo(new Date(plan.createdAt))}</span>
                    </div>

                    {/* 操作按钮 */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <Link href={`/plan/${plan.id}`} className="block">
                        <Button
                          variant={plan.status === "completed" ? "outline" : "default"}
                          className="w-full"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          {plan.status === "completed" ? "复习" : "开始学习"}
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
          </>
        )}
      </div>
    </div>
  )
}
