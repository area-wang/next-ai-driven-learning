import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { reviewSchedules, knowledgeContents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/review/schedules
 * 获取指定内容的复习计划
 * 支持通过 outlineId 或 contentId 查询
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
    const outlineId = searchParams.get('outlineId')

    console.log('[复习计划查询] 开始查询, userId:', userId, 'contentId:', contentId, 'outlineId:', outlineId)

    if (!contentId && !outlineId) {
      return NextResponse.json({ error: '缺少 contentId 或 outlineId 参数' }, { status: 400 })
    }

    // 如果提供了 outlineId，先查找对应的 knowledge_contents 记录
    let actualContentId = contentId
    if (outlineId) {
      console.log('[复习计划查询] 查找 knowledge_contents, outlineId:', outlineId)
      const content = await db
        .select()
        .from(knowledgeContents)
        .where(eq(knowledgeContents.outlineId, outlineId))
        .limit(1)
      
      if (content.length > 0) {
        actualContentId = content[0].id
        console.log('[复习计划查询] 找到 knowledge_contents, contentId:', actualContentId)
      } else {
        console.log('[复习计划查询] 未找到 knowledge_contents')
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
          message: '该内容还没有复习计划'
        })
      }
    }

    if (!actualContentId) {
      return NextResponse.json({ error: '无法确定内容 ID' }, { status: 400 })
    }

    // 查询复习计划
    const results = await db
      .select()
      .from(reviewSchedules)
      .where(
        and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.contentId, actualContentId)
        )
      )
      .orderBy(reviewSchedules.reviewRound)

    console.log('[复习计划查询] 查询结果数量:', results.length)

    // 统计各状态的数量
    const stats = {
      total: results.length,
      pending: results.filter(r => r.status === 'pending').length,
      completed: results.filter(r => r.status === 'completed').length,
      overdue: results.filter(r => {
        if (r.status !== 'pending') return false
        return new Date(r.scheduledAt) < new Date()
      }).length,
    }

    return NextResponse.json({
      success: true,
      data: results,
      stats,
      count: results.length
    })
  } catch (error) {
    console.error('[复习计划查询] 获取复习计划失败:', error)
    return NextResponse.json(
      { error: '获取复习计划失败' },
      { status: 500 }
    )
  }
}
