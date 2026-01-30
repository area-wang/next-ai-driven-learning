import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { flashcards, flashcardReviews } from '@/db/schema'
import { eq, and, lte, or, isNull, count, sql } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/flashcards/stats - 获取闪卡统计数据
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

    // 构建查询条件
    const conditions = [eq(flashcards.userId, userId)]
    if (contentId) {
      conditions.push(eq(flashcards.contentId, contentId))
    }

    // 总卡片数
    const [totalResult] = await db
      .select({ count: count() })
      .from(flashcards)
      .where(and(...conditions))

    const totalCards = totalResult?.count || 0

    // 待复习卡片数
    const now = new Date()
    const [dueResult] = await db
      .select({ count: count() })
      .from(flashcards)
      .where(
        and(
          ...conditions,
          or(
            lte(flashcards.nextReviewAt, now),
            isNull(flashcards.nextReviewAt)
          )!
        )
      )

    const dueCards = dueResult?.count || 0

    // 已掌握卡片数（重复次数 >= 3 且间隔 >= 7 天）
    const [masteredResult] = await db
      .select({ count: count() })
      .from(flashcards)
      .where(
        and(
          ...conditions,
          sql`${flashcards.repetitions} >= 3`,
          sql`${flashcards.interval} >= 7`
        )
      )

    const masteredCards = masteredResult?.count || 0

    // 新卡片数（从未复习过）
    const [newResult] = await db
      .select({ count: count() })
      .from(flashcards)
      .where(
        and(
          ...conditions,
          eq(flashcards.repetitions, 0)
        )
      )

    const newCards = newResult?.count || 0

    // 学习中卡片数
    const learningCards = totalCards - newCards - masteredCards

    // 最近7天的复习统计
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentReviews = await db
      .select({
        date: sql<string>`date(${flashcardReviews.reviewedAt} / 1000, 'unixepoch')`,
        count: count(),
        avgQuality: sql<number>`avg(${flashcardReviews.quality})`,
      })
      .from(flashcardReviews)
      .where(
        and(
          eq(flashcardReviews.userId, userId),
          sql`${flashcardReviews.reviewedAt} >= ${sevenDaysAgo}`
        )
      )
      .groupBy(sql`date(${flashcardReviews.reviewedAt} / 1000, 'unixepoch')`)
      .orderBy(sql`date(${flashcardReviews.reviewedAt} / 1000, 'unixepoch')`)

    // 总复习次数
    const [totalReviewsResult] = await db
      .select({ count: count() })
      .from(flashcardReviews)
      .where(eq(flashcardReviews.userId, userId))

    const totalReviews = totalReviewsResult?.count || 0

    // 平均复习质量
    const [avgQualityResult] = await db
      .select({ avgQuality: sql<number>`avg(${flashcardReviews.quality})` })
      .from(flashcardReviews)
      .where(eq(flashcardReviews.userId, userId))

    const avgQuality = avgQualityResult?.avgQuality || 0

    return NextResponse.json({
      success: true,
      data: {
        totalCards,
        dueCards,
        masteredCards,
        newCards,
        learningCards,
        totalReviews,
        avgQuality: Math.round(avgQuality * 10) / 10,
        recentReviews: recentReviews.map(r => ({
          date: r.date,
          count: r.count,
          avgQuality: Math.round((r.avgQuality || 0) * 10) / 10,
        })),
      }
    })
  } catch (error) {
    console.error('获取闪卡统计失败:', error)
    return NextResponse.json({ error: '获取闪卡统计失败' }, { status: 500 })
  }
}
