import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { reviewSchedules, knowledgeContents } from '@/db/schema'
import { generateEbbinghausSchedule } from '@/lib/learning-methods/ebbinghaus'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * POST /api/review/schedule
 * 为学习内容生成艾宾浩斯复习计划
 * 支持通过 outlineId 或 contentId 创建复习计划
 */
export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as { 
      contentId?: string
      outlineId?: string 
    }
    const { contentId, outlineId } = body

    if (!contentId && !outlineId) {
      return NextResponse.json({ error: '缺少 contentId 或 outlineId 参数' }, { status: 400 })
    }

    console.log('[复习计划] 创建复习计划, userId:', userId, 'contentId:', contentId, 'outlineId:', outlineId)

    // 如果提供了 outlineId，先查找或创建对应的 knowledge_contents 记录
    let actualContentId = contentId
    if (outlineId) {
      console.log('[复习计划] 查找 knowledge_contents, outlineId:', outlineId)
      const content = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outlineId))
        .limit(1)
      
      if (content.length > 0) {
        actualContentId = content[0].id
        console.log('[复习计划] 找到 knowledge_contents, contentId:', actualContentId)
      } else {
        // 如果不存在，创建一个新的 knowledge_contents 记录
        console.log('[复习计划] 未找到 knowledge_contents, 创建新记录')
        const newContent = await db
          .insert(knowledgeContents)
          .values({
            outlineId,
            content: '', // 空内容，等待用户编辑
          })
          .returning()
        
        actualContentId = newContent[0].id
        console.log('[复习计划] 创建成功, contentId:', actualContentId)
      }
    }

    if (!actualContentId) {
      return NextResponse.json({ error: '无法确定内容 ID' }, { status: 400 })
    }

    // 检查是否已存在复习计划
    const existing = await db
      .select()
      .from(reviewSchedules)
      .where(
        and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.contentId, actualContentId)
        )
      )

    const isRegenerate = existing.length > 0

    // 生成艾宾浩斯复习计划
    const startTime = new Date()
    const schedules = generateEbbinghausSchedule(startTime)

    console.log('[复习计划] 生成艾宾浩斯计划, 轮次数:', schedules.length)

    // 先保存新计划到数据库
    const savedSchedules = []
    try {
      for (const schedule of schedules) {
        const result = await db.insert(reviewSchedules).values({
          userId,
          contentId: actualContentId,
          reviewRound: schedule.round,
          scheduledAt: schedule.scheduledAt,
          status: 'pending',
        }).returning()

        savedSchedules.push(result[0])
      }

      console.log('[复习计划] 新计划保存成功, 计划数:', savedSchedules.length)

      // 只有新计划保存成功后，才删除旧的计划
      if (isRegenerate) {
        console.log('[复习计划] 删除旧的复习计划, 数量:', existing.length)
        // 删除旧计划（通过 ID 删除，避免误删新计划）
        for (const old of existing) {
          await db
            .delete(reviewSchedules)
            .where(eq(reviewSchedules.id, old.id))
        }
        console.log('[复习计划] 旧计划已删除')
      }
    } catch (error) {
      console.error('[复习计划] 保存新计划失败:', error)
      // 如果保存失败，尝试清理已保存的部分新计划
      if (savedSchedules.length > 0) {
        console.log('[复习计划] 清理部分保存的新计划')
        for (const saved of savedSchedules) {
          try {
            await db
              .delete(reviewSchedules)
              .where(eq(reviewSchedules.id, saved.id))
          } catch (cleanupError) {
            console.error('[复习计划] 清理失败:', cleanupError)
          }
        }
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      schedules: savedSchedules,
      message: isRegenerate 
        ? `已重新生成 ${schedules.length} 轮复习计划` 
        : `已为该内容生成 ${schedules.length} 轮复习计划`
    })
  } catch (error) {
    console.error('[复习计划] 生成复习计划失败:', error)
    return NextResponse.json(
      { error: '生成复习计划失败' },
      { status: 500 }
    )
  }
}
