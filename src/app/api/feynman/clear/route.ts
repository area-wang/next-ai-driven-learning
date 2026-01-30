import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { feynmanExplanations } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * DELETE /api/feynman/clear - 清除指定内容的所有费曼解释
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const contentId = searchParams.get('contentId')

    if (!contentId) {
      return NextResponse.json({ error: '缺少 contentId 参数' }, { status: 400 })
    }

    // 删除指定内容的所有费曼解释
    const result = await db
      .delete(feynmanExplanations)
      .where(
        and(
          eq(feynmanExplanations.userId, userId),
          eq(feynmanExplanations.contentId, contentId)
        )
      )

    return NextResponse.json({
      success: true,
      message: '费曼解释历史记录已清除'
    })
  } catch (error) {
    console.error('清除费曼解释失败:', error)
    return NextResponse.json({ error: '清除费曼解释失败' }, { status: 500 })
  }
}
