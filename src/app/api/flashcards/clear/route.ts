import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { flashcards, knowledgeContents } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * DELETE /api/flashcards/clear - 清除指定内容的所有闪卡
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId') // 这里实际上可能是 outlineId

    console.log('[闪卡清除] 开始清除闪卡, userId:', userId, 'contentId:', contentId)

    if (!contentId) {
      return NextResponse.json({ error: '缺少 contentId 参数' }, { status: 400 })
    }

    // 先尝试根据 outlineId 查找 knowledge_contents 记录
    const content = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, contentId))
      .limit(1)
    
    let actualContentId = contentId
    if (content.length > 0) {
      actualContentId = content[0].id
      console.log('[闪卡清除] 找到 knowledge_contents, 使用 contentId:', actualContentId)
    } else {
      console.log('[闪卡清除] 未找到 knowledge_contents, 直接使用 contentId:', contentId)
    }

    // 删除指定内容的所有闪卡
    const result = await db
      .delete(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.contentId, actualContentId)
        )
      )

    console.log('[闪卡清除] 清除完成')

    return NextResponse.json({
      success: true,
      message: '闪卡历史记录已清除'
    })
  } catch (error) {
    console.error('[闪卡清除] 清除闪卡失败:', error)
    return NextResponse.json({ error: '清除闪卡失败' }, { status: 500 })
  }
}
