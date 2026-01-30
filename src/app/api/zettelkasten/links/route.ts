import { NextRequest, NextResponse } from 'next/server'
import { getDbClient } from '@/lib/db-connection'
import { noteLinks, zettelkastenNotes } from '@/db/schema'
import { eq, and, or } from 'drizzle-orm'

/**
 * GET /api/zettelkasten/links - 获取笔记链接
 * POST /api/zettelkasten/links - 创建笔记链接
 * DELETE /api/zettelkasten/links - 删除笔记链接
 */

export async function GET(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) {
      // 获取所有链接
      const results = await db.select().from(noteLinks)
      return NextResponse.json({
        success: true,
        data: results,
      })
    }

    // 获取特定笔记的所有链接（包括出链和入链）
    const results = await db
      .select()
      .from(noteLinks)
      .where(
        or(
          eq(noteLinks.fromNoteId, noteId),
          eq(noteLinks.toNoteId, noteId)
        )
      )

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error) {
    console.error('获取笔记链接失败:', error)
    return NextResponse.json({ error: '获取笔记链接失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const body = await request.json() as {
      fromNoteId: string
      toNoteId: string
      linkType?: 'related' | 'parent' | 'child' | 'reference'
    }

    const { fromNoteId, toNoteId, linkType = 'related' } = body

    if (!fromNoteId || !toNoteId) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    if (fromNoteId === toNoteId) {
      return NextResponse.json({ error: '不能链接到自己' }, { status: 400 })
    }

    // 检查笔记是否存在
    const notes = await db
      .select()
      .from(zettelkastenNotes)
      .where(
        or(
          eq(zettelkastenNotes.id, fromNoteId),
          eq(zettelkastenNotes.id, toNoteId)
        )
      )

    if (notes.length !== 2) {
      return NextResponse.json({ error: '笔记不存在' }, { status: 404 })
    }

    // 检查链接是否已存在
    const existingLink = await db
      .select()
      .from(noteLinks)
      .where(
        and(
          eq(noteLinks.fromNoteId, fromNoteId),
          eq(noteLinks.toNoteId, toNoteId)
        )
      )

    if (existingLink.length > 0) {
      return NextResponse.json({ error: '链接已存在' }, { status: 400 })
    }

    const result = await db.insert(noteLinks).values({
      fromNoteId,
      toNoteId,
      linkType,
    }).returning()

    return NextResponse.json({
      success: true,
      data: result[0],
      message: '链接已创建'
    })
  } catch (error) {
    console.error('创建笔记链接失败:', error)
    return NextResponse.json({ error: '创建笔记链接失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const db = getDbClient(request)
    if (!db) {
      return NextResponse.json({ error: '数据库连接失败' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: '缺少链接 ID' }, { status: 400 })
    }

    await db.delete(noteLinks).where(eq(noteLinks.id, id))

    return NextResponse.json({
      success: true,
      message: '链接已删除'
    })
  } catch (error) {
    console.error('删除笔记链接失败:', error)
    return NextResponse.json({ error: '删除笔记链接失败' }, { status: 500 })
  }
}
