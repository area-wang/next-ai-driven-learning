import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { flashcards, flashcardReviews } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { calculateSM2 } from '@/lib/learning-methods/sm2'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * POST /api/flashcards/review - 提交闪卡复习结果
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      flashcardId: string
      quality: number // 0-5
      timeSpent?: number
    }

    const { flashcardId, quality, timeSpent } = body

    if (!flashcardId || quality === undefined) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (quality < 0 || quality > 5) {
      return NextResponse.json({ error: '质量评分必须在 0-5 之间' }, { status: 400 })
    }

    // 获取当前闪卡数据
    const [flashcard] = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.id, flashcardId))

    if (!flashcard) {
      return NextResponse.json({ error: '闪卡不存在' }, { status: 404 })
    }

    // 计算新的 SM-2 参数
    const currentEF = (flashcard.easinessFactor || 2500) / 1000 // 转换回小数
    const sm2Result = calculateSM2(quality, {
      easinessFactor: currentEF,
      repetitions: flashcard.repetitions || 0,
      interval: flashcard.interval || 0,
    })

    // 更新闪卡
    const now = new Date()
    await db
      .update(flashcards)
      .set({
        easinessFactor: Math.round(sm2Result.easinessFactor * 1000),
        repetitions: sm2Result.repetitions,
        interval: sm2Result.interval,
        nextReviewAt: sm2Result.nextReviewAt,
        lastReviewedAt: now,
        updatedAt: now,
      })
      .where(eq(flashcards.id, flashcardId))

    // 记录复习历史
    await db.insert(flashcardReviews).values({
      flashcardId,
      userId,
      quality,
      reviewedAt: now,
      timeSpent: timeSpent || null,
    })

    return NextResponse.json({
      success: true,
      data: {
        nextReviewAt: sm2Result.nextReviewAt.getTime(),
        interval: sm2Result.interval,
        repetitions: sm2Result.repetitions,
        easinessFactor: sm2Result.easinessFactor,
      },
      message: '复习记录已保存'
    })
  } catch (error) {
    console.error('提交复习结果失败:', error)
    return NextResponse.json({ error: '提交复习结果失败' }, { status: 500 })
  }
}
