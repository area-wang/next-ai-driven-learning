import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { zettelkastenNotes } from '@/db/schema'
import { eq, and, desc, like, or } from 'drizzle-orm'
import { getUserIdOrDemo } from '@/lib/auth/get-user'

/**
 * GET /api/zettelkasten/notes - 获取卡片盒笔记列表
 * POST /api/zettelkasten/notes - 创建卡片盒笔记
 * PUT /api/zettelkasten/notes - 更新卡片盒笔记
 * DELETE /api/zettelkasten/notes - 删除卡片盒笔记
 */

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const tag = searchParams.get('tag')

    let conditions = [eq(zettelkastenNotes.userId, userId)]

    // 搜索功能
    if (search) {
      conditions.push(
        or(
          like(zettelkastenNotes.title, `%${search}%`),
          like(zettelkastenNotes.content, `%${search}%`)
        ) as any
      )
    }

    const results = await db
      .select()
      .from(zettelkastenNotes)
      .where(and(...conditions))
      .orderBy(desc(zettelkastenNotes.createdAt))

    // 标签过滤（在内存中进行）
    let filteredResults = results.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : [],
    }))

    if (tag) {
      filteredResults = filteredResults.filter(note =>
        note.tags.includes(tag)
      )
    }

    return NextResponse.json({
      success: true,
      data: filteredResults,
    })
  } catch (error) {
    console.error('获取卡片盒笔记失败:', error)
    return NextResponse.json({ error: '获取卡片盒笔记失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      title: string
      content: string
      tags?: string[]
    }

    const { title, content, tags } = body

    if (!title || !content) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const result = await db.insert(zettelkastenNotes).values({
      userId,
      title: title.trim(),
      content: content.trim(),
      tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
    }).returning()

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        tags: result[0].tags ? JSON.parse(result[0].tags) : [],
      },
      message: '笔记已创建'
    })
  } catch (error) {
    console.error('创建卡片盒笔记失败:', error)
    return NextResponse.json({ error: '创建卡片盒笔记失败' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const body = await request.json() as {
      id: string
      title?: string
      content?: string
      tags?: string[]
    }

    const { id, title, content, tags } = body

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: Date.now(),
    }
    if (title !== undefined) updateData.title = title.trim()
    if (content !== undefined) updateData.content = content.trim()
    if (tags !== undefined) {
      updateData.tags = tags.length > 0 ? JSON.stringify(tags) : null
    }

    const result = await db
      .update(zettelkastenNotes)
      .set(updateData)
      .where(and(eq(zettelkastenNotes.id, id), eq(zettelkastenNotes.userId, userId)))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result[0],
        tags: result[0].tags ? JSON.parse(result[0].tags) : [],
      },
      message: '笔记已更新'
    })
  } catch (error) {
    console.error('更新卡片盒笔记失败:', error)
    return NextResponse.json({ error: '更新卡片盒笔记失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const userId = await getUserIdOrDemo()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少笔记 ID' }, { status: 400 })
    }

    await db
      .delete(zettelkastenNotes)
      .where(and(eq(zettelkastenNotes.id, id), eq(zettelkastenNotes.userId, userId)))

    return NextResponse.json({
      success: true,
      message: '笔记已删除'
    })
  } catch (error) {
    console.error('删除卡片盒笔记失败:', error)
    return NextResponse.json({ error: '删除卡片盒笔记失败' }, { status: 500 })
  }
}
