import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { reviewSchedules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getNextReviewTime, adjustReviewTime } from '@/lib/learning-methods/ebbinghaus'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * POST /api/review/complete
 * 完成复习
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as { 
      scheduleId?: string
      effectiveness?: number
    }
    const { scheduleId, effectiveness } = body

    console.log('[复习完成] 开始处理, userId:', userId, 'scheduleId:', scheduleId, 'effectiveness:', effectiveness)

    if (!scheduleId) {
      return NextResponse.json({ error: '缺少 scheduleId 参数' }, { status: 400 })
    }

    // 验证 effectiveness 范围 (1-5)
    const validEffectiveness = effectiveness && effectiveness >= 1 && effectiveness <= 5
      ? effectiveness
      : 3

    // 查询复习计划
    const schedule = await db
      .select()
      .from(reviewSchedules)
      .where(
        and(
          eq(reviewSchedules.id, scheduleId),
          eq(reviewSchedules.userId, userId)
        )
      )
      .limit(1)

    if (schedule.length === 0) {
      console.log('[复习完成] 复习计划不存在')
      return NextResponse.json({ error: '复习计划不存在' }, { status: 404 })
    }

    const currentSchedule = schedule[0]
    const completedAt = new Date()

    console.log('[复习完成] 当前轮次:', currentSchedule.reviewRound)

    // 计算下次复习时间
    let nextReviewAt = getNextReviewTime(currentSchedule.reviewRound, completedAt)

    // 根据复习效果调整时间
    if (nextReviewAt && validEffectiveness !== 3) {
      nextReviewAt = adjustReviewTime(nextReviewAt, validEffectiveness)
    }

    console.log('[复习完成] 下次复习时间:', nextReviewAt)

    // 更新当前复习计划
    await db
      .update(reviewSchedules)
      .set({
        status: 'completed',
        completedAt,
        effectiveness: validEffectiveness,
        nextReviewAt,
      })
      .where(eq(reviewSchedules.id, scheduleId))

    // 如果还有下一轮，创建新的复习计划
    if (nextReviewAt && currentSchedule.reviewRound < 8) {
      console.log('[复习完成] 创建下一轮复习计划, 轮次:', currentSchedule.reviewRound + 1)
      await db.insert(reviewSchedules).values({
        userId,
        contentId: currentSchedule.contentId,
        reviewRound: currentSchedule.reviewRound + 1,
        scheduledAt: nextReviewAt,
        status: 'pending',
      })
    }

    console.log('[复习完成] 处理完成')

    return NextResponse.json({
      success: true,
      message: '复习完成',
      data: {
        completedRound: currentSchedule.reviewRound,
        nextReviewAt,
        hasNextRound: currentSchedule.reviewRound < 8,
      }
    })
  } catch (error) {
    console.error('[复习完成] 完成复习失败:', error)
    return NextResponse.json(
      { error: '完成复习失败' },
      { status: 500 }
    )
  }
}
