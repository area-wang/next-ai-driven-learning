/**
 * 获取文档摘要 API
 * GET /api/ai/get-summary?contentId=xxx 或 GET /api/ai/get-summary?outlineId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getCurrentUserId } from '@/lib/auth/get-user'

export const runtime = 'nodejs'

/**
 * 获取文档摘要
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')
    const outlineId = searchParams.get('outlineId')

    if (!contentId && !outlineId) {
      return NextResponse.json(
        { error: '缺少 contentId 或 outlineId 参数' },
        { status: 400 }
      )
    }

    // 从数据库获取摘要
    const db = getDbClient(request as unknown as Request)
    if (!db) {
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    // 根据 contentId 或 outlineId 查询
    const result = await db
      .select({ summary: knowledgeContents.summary })
      .from(knowledgeContents)
      .where(
        contentId 
          ? eq(knowledgeContents.id, contentId)
          : eq(knowledgeContents.outlineId, outlineId!)
      )
      .limit(1)

    if (result.length === 0) {
      return NextResponse.json(
        { error: '文档不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      summary: result[0].summary || null,
    })
  } catch (error) {
    console.error('[Get Summary API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取摘要失败' },
      { status: 500 }
    )
  }
}
