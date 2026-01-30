import { NextRequest, NextResponse } from 'next/server'
import { getUserIdOrDemo } from '@/lib/auth/get-user'
import { getDbClient } from '@/lib/db-connection'
import { 
  learningPlans, 
  learningProgress, 
  pomodoroSessions,
  reviewSchedules,
  learningOutlines,
  knowledgeContents
} from '@/db/schema'
import { eq, and, sql, gte, lte, desc } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()

    // 1. 统计学习计划数量（活跃的）
    const activePlansCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(learningPlans)
      .where(
        and(
          eq(learningPlans.userId, userId),
          eq(learningPlans.status, 'active')
        )
      )

    // 2. 统计完成的学习内容数量
    const completedContentsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.status, 'completed')
        )
      )

    // 3. 统计总学习时长（番茄钟 + 学习进度）
    const pomodoroTime = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${pomodoroSessions.actualDuration}), 0)` 
      })
      .from(pomodoroSessions)
      .where(
        and(
          eq(pomodoroSessions.userId, userId),
          eq(pomodoroSessions.status, 'completed')
        )
      )

    const progressTime = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(${learningProgress.timeSpent}), 0)` 
      })
      .from(learningProgress)
      .where(eq(learningProgress.userId, userId))

    const totalSeconds = (pomodoroTime[0]?.total || 0) + (progressTime[0]?.total || 0)
    const totalHours = Math.round(totalSeconds / 3600)

    // 4. 计算进步指数（最近7天完成的内容数量相比前7天的增长率）
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

    const recentCompletions = await db
      .select({ count: sql<number>`count(*)` })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.status, 'completed'),
          gte(learningProgress.completedAt, sevenDaysAgo)
        )
      )

    const previousCompletions = await db
      .select({ count: sql<number>`count(*)` })
      .from(learningProgress)
      .where(
        and(
          eq(learningProgress.userId, userId),
          eq(learningProgress.status, 'completed'),
          gte(learningProgress.completedAt, fourteenDaysAgo),
          lte(learningProgress.completedAt, sevenDaysAgo)
        )
      )

    const recentCount = recentCompletions[0]?.count || 0
    const previousCount = previousCompletions[0]?.count || 0
    const progressIndex = previousCount > 0 
      ? Math.round(((recentCount - previousCount) / previousCount) * 100)
      : recentCount > 0 ? 100 : 0

    // 5. 获取最近学习的计划（最多3个）
    const recentPlans = await db
      .select({
        id: learningPlans.id,
        title: learningPlans.title,
        progress: learningPlans.progress,
        status: learningPlans.status,
        updatedAt: learningPlans.updatedAt,
      })
      .from(learningPlans)
      .where(eq(learningPlans.userId, userId))
      .orderBy(desc(learningPlans.updatedAt))
      .limit(3)

    // 6. 获取今天需要复习的内容
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayReviews = await db
      .select({
        id: reviewSchedules.id,
        contentId: reviewSchedules.contentId,
        reviewRound: reviewSchedules.reviewRound,
        scheduledAt: reviewSchedules.scheduledAt,
        status: reviewSchedules.status,
        outlineId: knowledgeContents.outlineId,
        outlineTitle: learningOutlines.title,
        planId: learningOutlines.planId,
        planTitle: learningPlans.title,
      })
      .from(reviewSchedules)
      .innerJoin(knowledgeContents, eq(reviewSchedules.contentId, knowledgeContents.id))
      .innerJoin(learningOutlines, eq(knowledgeContents.outlineId, learningOutlines.id))
      .innerJoin(learningPlans, eq(learningOutlines.planId, learningPlans.id))
      .where(
        and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.status, 'pending'),
          // 只比较日期部分，不比较时间
          sql`date(${reviewSchedules.scheduledAt} / 1000, 'unixepoch') = date(${today.getTime()} / 1000, 'unixepoch')`
        )
      )
      .orderBy(reviewSchedules.scheduledAt)

    console.log('=== 仪表盘数据调试 ===')
    console.log('用户ID:', userId)
    console.log('今天日期:', today.toISOString())
    console.log('活跃计划数量:', activePlansCount[0]?.count || 0)
    console.log('最近学习计划:', recentPlans.length, '个')
    console.log('计划详情:', recentPlans.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status,
      progress: p.progress,
      updatedAt: p.updatedAt
    })))
    console.log('今日复习数量:', todayReviews.length, '个')
    console.log('今日复习详情:', todayReviews.map(r => ({
      id: r.id,
      outlineTitle: r.outlineTitle,
      reviewRound: r.reviewRound,
      scheduledAt: new Date(r.scheduledAt).toISOString()
    })))
    console.log('======================\n')

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          activePlans: activePlansCount[0]?.count || 0,
          completedContents: completedContentsCount[0]?.count || 0,
          totalHours,
          progressIndex,
        },
        recentPlans: recentPlans.map((plan) => ({
          id: plan.id,
          title: plan.title,
          progress: plan.progress || 0,
          status: plan.status === 'completed' ? '已完成' : '进行中',
          lastAccess: formatRelativeTime(plan.updatedAt),
        })),
        todayReviews: todayReviews.map((review) => ({
          id: review.id,
          planId: review.planId,
          planTitle: review.planTitle,
          outlineId: review.outlineId,
          outlineTitle: review.outlineTitle,
          reviewRound: review.reviewRound,
          scheduledAt: review.scheduledAt,
        })),
      },
    })
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    return NextResponse.json(
      { success: false, error: '获取仪表盘数据失败' },
      { status: 500 }
    )
  }
}

// 格式化相对时间
function formatRelativeTime(date: Date | null): string {
  if (!date) return '未知'
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}天前`
  if (hours > 0) return `${hours}小时前`
  if (minutes > 0) return `${minutes}分钟前`
  return '刚刚'
}
