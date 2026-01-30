import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { 
  flashcards, 
  reviewSchedules, 
  feynmanExplanations,
  cornellNotes,
  knowledgeContents 
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * DELETE /api/learning-materials/clear
 * 清除指定文档的所有学习材料（闪卡、复习计划、费曼解释、康奈尔笔记）
 * 当用户重新生成文档内容时调用，因为旧的学习材料已经不适用了
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const outlineId = searchParams.get('outlineId')

    console.log('[清空学习材料] 开始清空, userId:', userId, 'outlineId:', outlineId)

    if (!outlineId) {
      return NextResponse.json({ error: '缺少 outlineId 参数' }, { status: 400 })
    }

    // 先查找对应的 knowledge_contents 记录
    const content = await db
      .select()
      .from(knowledgeContents)
      .where(eq(knowledgeContents.outlineId, outlineId))
      .limit(1)
    
    if (content.length === 0) {
      console.log('[清空学习材料] 未找到 knowledge_contents 记录，无需清空')
      return NextResponse.json({
        success: true,
        message: '无学习材料需要清空'
      })
    }

    const contentId = content[0].id
    console.log('[清空学习材料] 找到 contentId:', contentId)

    // 清空闪卡
    const flashcardsResult = await db
      .delete(flashcards)
      .where(
        and(
          eq(flashcards.userId, userId),
          eq(flashcards.contentId, contentId)
        )
      )
    console.log('[清空学习材料] 清空闪卡完成')

    // 清空复习计划
    const reviewResult = await db
      .delete(reviewSchedules)
      .where(
        and(
          eq(reviewSchedules.userId, userId),
          eq(reviewSchedules.contentId, contentId)
        )
      )
    console.log('[清空学习材料] 清空复习计划完成')

    // 清空费曼解释
    const feynmanResult = await db
      .delete(feynmanExplanations)
      .where(
        and(
          eq(feynmanExplanations.userId, userId),
          eq(feynmanExplanations.contentId, contentId)
        )
      )
    console.log('[清空学习材料] 清空费曼解释完成')

    // 清空康奈尔笔记
    const cornellResult = await db
      .delete(cornellNotes)
      .where(
        and(
          eq(cornellNotes.userId, userId),
          eq(cornellNotes.contentId, contentId)
        )
      )
    console.log('[清空学习材料] 清空康奈尔笔记完成')

    console.log('[清空学习材料] 所有学习材料清空完成')

    return NextResponse.json({
      success: true,
      message: '学习材料已清空'
    })
  } catch (error) {
    console.error('[清空学习材料] 清空失败:', error)
    return NextResponse.json({ error: '清空学习材料失败' }, { status: 500 })
  }
}
