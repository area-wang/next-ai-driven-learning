import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { reviewSchedules, knowledgeContents, learningOutlines } from '@/db/schema'
import { eq, and, lte } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/review/due
 * 获取待复习的内容
 */
export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // all | today | overdue

    const now = new Date()
    const today = new Date(now)
    today.setHours(23, 59, 59, 999)

    // 查询待复习的内容
    const results = await db
      .select({
        schedule: reviewSchedules,
        content: knowledgeContents,
        outline: learningOutlines,
      })
      .from(reviewSchedules)
      .leftJoin(knowledgeContents, eq(reviewSchedules.contentId, knowledgeContents.id))
      .leftJoin(learningOutlines, eq(knowledgeContents.outlineId, learningOutlines.id))
      .where(
        and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.status, 'pending')
        )
      )

    // 分类结果
    const dueReviews = {
      today: [] as typeof results,
      overdue: [] as typeof results,
      upcoming: [] as typeof results,
    }

    for (const result of results) {
      const scheduledDate = new Date(result.schedule.scheduledAt)
      
      if (scheduledDate < now) {
        dueReviews.overdue.push(result)
      } else if (scheduledDate <= today) {
        dueReviews.today.push(result)
      } else {
        dueReviews.upcoming.push(result)
      }
    }

    return NextResponse.json({
      success: true,
      data: type === 'all' ? dueReviews : results,
      count: {
        today: dueReviews.today.length,
        overdue: dueReviews.overdue.length,
        upcoming: dueReviews.upcoming.length,
        total: results.length,
      }
    })
  } catch (error) {
    console.error('获取待复习内容失败:', error)
    return NextResponse.json(
      { error: '获取待复习内容失败' },
      { status: 500 }
    )
  }
}
