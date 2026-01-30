import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { reviewSchedules } from '@/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'
import { calculateProgress } from '@/lib/learning-methods/ebbinghaus'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/review/stats
 * 获取复习统计数据
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const days = parseInt(searchParams.get('days') || '7')

    // 基础查询条件
    const baseCondition = contentId
      ? and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.contentId, contentId)
        )
      : eq(reviewSchedules.userId, userId)

    // 1. 总体统计
    const totalStats = await db
      .select({
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${reviewSchedules.status} = 'completed' then 1 else 0 end)`,
        pending: sql<number>`sum(case when ${reviewSchedules.status} = 'pending' then 1 else 0 end)`,
        skipped: sql<number>`sum(case when ${reviewSchedules.status} = 'skipped' then 1 else 0 end)`,
      })
      .from(reviewSchedules)
      .where(baseCondition)

    const stats = totalStats[0]

    // 2. 最近 N 天的复习完成情况
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const recentReviews = await db
      .select({
        date: sql<string>`date(${reviewSchedules.completedAt})`,
        count: sql<number>`count(*)`,
        avgEffectiveness: sql<number>`avg(${reviewSchedules.effectiveness})`,
      })
      .from(reviewSchedules)
      .where(
        and(
          baseCondition,
          eq(reviewSchedules.status, 'completed'),
          gte(reviewSchedules.completedAt, startDate)
        )
      )
      .groupBy(sql`date(${reviewSchedules.completedAt})`)
      .orderBy(sql`date(${reviewSchedules.completedAt})`)

    // 3. 按轮次统计
    const roundStats = await db
      .select({
        round: reviewSchedules.reviewRound,
        total: sql<number>`count(*)`,
        completed: sql<number>`sum(case when ${reviewSchedules.status} = 'completed' then 1 else 0 end)`,
        avgEffectiveness: sql<number>`avg(case when ${reviewSchedules.status} = 'completed' then ${reviewSchedules.effectiveness} else null end)`,
      })
      .from(reviewSchedules)
      .where(baseCondition)
      .groupBy(reviewSchedules.reviewRound)
      .orderBy(reviewSchedules.reviewRound)

    // 4. 计算完成率和进度
    const completionRate = stats.total > 0
      ? Math.round((Number(stats.completed) / Number(stats.total)) * 100)
      : 0

    // 如果是单个内容，计算其复习进度
    let progress = 0
    if (contentId) {
      const maxCompletedRound = await db
        .select({ maxRound: sql<number>`max(${reviewSchedules.reviewRound})` })
        .from(reviewSchedules)
        .where(
          and(
            baseCondition,
            eq(reviewSchedules.status, 'completed')
          )
        )

      if (maxCompletedRound[0]?.maxRound) {
        progress = calculateProgress(maxCompletedRound[0].maxRound)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total: Number(stats.total),
          completed: Number(stats.completed),
          pending: Number(stats.pending),
          skipped: Number(stats.skipped),
          completionRate,
          progress,
        },
        recentReviews,
        roundStats,
      }
    })
  } catch (error) {
    console.error('获取复习统计失败:', error)
    return NextResponse.json(
      { error: '获取复习统计失败' },
      { status: 500 }
    )
  }
}
