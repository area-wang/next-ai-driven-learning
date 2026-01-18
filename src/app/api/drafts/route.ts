/**
 * 草稿保存 API
 * 支持自动保存编辑器内容
 */

import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { drafts } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

// 临时：由于认证系统还未完全集成，暂时跳过认证检查
// TODO: 集成完整的认证系统后启用

interface DraftBody {
  title?: string
  content: string
  type?: string
}

// POST /api/drafts - 保存草稿
export async function POST(request: NextRequest) {
  try {
    // 临时：使用固定用户 ID 进行测试
    const userId = 'test-user-id'

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const body = await request.json() as DraftBody
    const { title, content, type = 'document' } = body

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    // 检查是否已存在该类型的草稿
    const existingDrafts = await db
      .select()
      .from(drafts)
      .where(
        and(
          eq(drafts.userId, userId),
          eq(drafts.type, type)
        )
      )
      .limit(1)

    let draft
    if (existingDrafts.length > 0) {
      // 更新现有草稿
      const updated = await db
        .update(drafts)
        .set({
          title: title || '无标题',
          content,
          updatedAt: new Date(),
        })
        .where(eq(drafts.id, existingDrafts[0].id))
        .returning()

      draft = updated[0]
    } else {
      // 创建新草稿
      const inserted = await db
        .insert(drafts)
        .values({
          userId,
          title: title || '无标题',
          content,
          type,
        })
        .returning()

      draft = inserted[0]
    }

    return NextResponse.json({
      success: true,
      draft: {
        id: draft.id,
        title: draft.title,
        updatedAt: draft.updatedAt,
      },
    })
  } catch (error) {
    console.error('保存草稿失败:', error)
    return NextResponse.json(
      { error: '保存草稿失败' },
      { status: 500 }
    )
  }
}

// GET /api/drafts - 获取草稿列表
export async function GET(request: NextRequest) {
  try {
    // 临时：使用固定用户 ID 进行测试
    const userId = 'test-user-id'

    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'document'

    const userDrafts = await db
      .select()
      .from(drafts)
      .where(
        and(
          eq(drafts.userId, userId),
          eq(drafts.type, type)
        )
      )
      .orderBy(drafts.updatedAt)

    return NextResponse.json({
      success: true,
      drafts: userDrafts,
    })
  } catch (error) {
    console.error('获取草稿失败:', error)
    return NextResponse.json(
      { error: '获取草稿失败' },
      { status: 500 }
    )
  }
}
