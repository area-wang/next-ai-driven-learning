/**
 * 获取大纲对应的内容ID API
 * GET /api/learning-outline/[outlineId]/content
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { knowledgeContents } from '@/db/schema'
import { eq } from 'drizzle-orm'

// 使用 Node.js runtime 以支持完整的数据库功能
// export const runtime = 'edge'

interface RouteParams {
  params: Promise<{
    outlineId: string
  }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const db = getDbClient(request)
    if (!db) {
      console.error('[content API] 数据库连接失败')
      return NextResponse.json(
        { error: '数据库连接失败' },
        { status: 500 }
      )
    }

    const { outlineId } = await params
    console.log('[content API] 查询 outlineId:', outlineId)

    // 查询内容
    const contents = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineId))
      .limit(1)

    console.log('[content API] 查询结果:', contents.length, '条记录')

    if (contents.length === 0) {
      console.warn('[content API] 内容不存在，outlineId:', outlineId)
      return NextResponse.json(
        { error: '内容不存在' },
        { status: 404 }
      )
    }

    console.log('[content API] 返回 contentId:', contents[0].id)
    return NextResponse.json({
      contentId: contents[0].id,
    })
  } catch (error) {
    console.error('[content API] 获取内容ID失败:', error)
    return NextResponse.json(
      { error: '查询失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
